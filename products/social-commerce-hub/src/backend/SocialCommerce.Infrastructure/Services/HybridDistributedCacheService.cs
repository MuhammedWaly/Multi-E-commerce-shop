using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Infrastructure.Services;

/// <summary>
/// Hybrid two-tier cache implementation:
/// L1: Fast In-Memory Cache (microsecond access)
/// L2: Distributed Cache / Redis (shared across nodes)
/// Includes robust fault-tolerance: transparently falls back to L1 if L2 is temporarily unreachable.
/// </summary>
public class HybridDistributedCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<HybridDistributedCacheService> _logger;
    private static readonly ConcurrentDictionary<string, byte> _knownKeys = new();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public HybridDistributedCacheService(
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        ILogger<HybridDistributedCacheService> logger)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        // 1. Check L1 Memory Cache
        if (_memoryCache.TryGetValue(key, out T? localValue))
        {
            return localValue;
        }

        // 2. Check L2 Distributed Cache (Redis)
        try
        {
            var bytes = await _distributedCache.GetAsync(key, cancellationToken);
            if (bytes != null && bytes.Length > 0)
            {
                var deserialized = JsonSerializer.Deserialize<T>(bytes, JsonOptions);
                if (deserialized != null)
                {
                    // Backfill L1 Memory Cache with short sliding expiration
                    _memoryCache.Set(key, deserialized, TimeSpan.FromMinutes(2));
                    _knownKeys.TryAdd(key, 0);
                    return deserialized;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read key {Key} from distributed cache. Falling back to source.", key);
        }

        return default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var ttl = expiration ?? TimeSpan.FromMinutes(10);

        // Store in L1 Memory Cache
        _memoryCache.Set(key, value, ttl);
        _knownKeys.TryAdd(key, 0);

        // Store in L2 Distributed Cache
        try
        {
            var bytes = JsonSerializer.SerializeToUtf8Bytes(value, JsonOptions);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl
            };
            await _distributedCache.SetAsync(key, bytes, options, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write key {Key} to distributed cache. In-memory cache remains active.", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        _memoryCache.Remove(key);
        _knownKeys.TryRemove(key, out _);

        try
        {
            await _distributedCache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to remove key {Key} from distributed cache.", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefixKey, CancellationToken cancellationToken = default)
    {
        var matchingKeys = _knownKeys.Keys.Where(k => k.StartsWith(prefixKey, StringComparison.OrdinalIgnoreCase)).ToList();
        foreach (var key in matchingKeys)
        {
            await RemoveAsync(key, cancellationToken);
        }
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var cached = await GetAsync<T>(key, cancellationToken);
        if (cached != null)
        {
            return cached;
        }

        var fresh = await factory();
        if (fresh != null)
        {
            await SetAsync(key, fresh, expiration, cancellationToken);
        }

        return fresh;
    }
}

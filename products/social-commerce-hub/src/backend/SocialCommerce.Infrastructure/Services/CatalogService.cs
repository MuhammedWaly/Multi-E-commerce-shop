using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;

namespace SocialCommerce.Infrastructure.Services;

public class CatalogService : ICatalogService
{
    private readonly SocialCommerceDbContext _db;

    public CatalogService(SocialCommerceDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<FeedItemDto>> GetFeedAsync(int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        var query = from p in _db.Products.AsNoTracking()
                    join m in _db.Merchants.AsNoTracking() on p.MerchantId equals m.Id
                    orderby p.CreatedAtUtc descending
                    select new FeedItemDto(
                        p.Id,
                        p.MerchantId,
                        m.StoreName,
                        m.Slug,
                        p.Title,
                        p.Price,
                        p.MediaUrl,
                        p.IsVideo,
                        4.9,
                        p.StockQuantity
                    );

        return await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<MerchantDto> CreateMerchantAsync(CreateMerchantRequest request, CancellationToken ct = default)
    {
        var existing = await _db.Merchants.AnyAsync(m => m.Slug == request.Slug.ToLowerInvariant(), ct);
        if (existing)
        {
            throw new ArgumentException($"Merchant slug '{request.Slug}' is already taken.");
        }

        var merchant = new Merchant(request.StoreName, request.Slug, request.Email);
        _db.Merchants.Add(merchant);
        await _db.SaveChangesAsync(ct);

        return new MerchantDto(
            merchant.Id,
            merchant.StoreName,
            merchant.Slug,
            merchant.Email,
            merchant.Balance,
            merchant.IsActive,
            merchant.CreatedAtUtc
        );
    }

    public async Task<MerchantDetailsDto?> GetMerchantBySlugAsync(string slug, CancellationToken ct = default)
    {
        var merchant = await _db.Merchants
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Slug == slug.ToLowerInvariant(), ct);

        if (merchant == null)
            return null;

        var products = await _db.Products
            .AsNoTracking()
            .Where(p => p.MerchantId == merchant.Id)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new ProductDto(
                p.Id,
                p.MerchantId,
                p.Title,
                p.Price,
                p.MediaUrl,
                p.IsVideo,
                p.StockQuantity,
                p.CreatedAtUtc
            ))
            .ToListAsync(ct);

        return new MerchantDetailsDto(
            merchant.Id,
            merchant.StoreName,
            merchant.Slug,
            merchant.Email,
            merchant.Balance,
            merchant.IsActive,
            merchant.CreatedAtUtc,
            products
        );
    }

    public async Task<ProductDto> AddProductAsync(Guid merchantId, AddProductRequest request, CancellationToken ct = default)
    {
        var merchantExists = await _db.Merchants.AnyAsync(m => m.Id == merchantId, ct);
        if (!merchantExists)
        {
            throw new ArgumentException("Merchant not found.", nameof(merchantId));
        }

        var product = new Product(merchantId, request.Title, request.Price, request.MediaUrl, request.IsVideo, request.StockQuantity);
        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);

        return new ProductDto(
            product.Id,
            product.MerchantId,
            product.Title,
            product.Price,
            product.MediaUrl,
            product.IsVideo,
            product.StockQuantity,
            product.CreatedAtUtc
        );
    }

    public async Task<ProductDto> UpdateProductAsync(Guid merchantId, Guid productId, UpdateProductRequest request, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product == null)
        {
            throw new KeyNotFoundException($"Product '{productId}' was not found.");
        }

        if (product.MerchantId != merchantId)
        {
            throw new UnauthorizedAccessException("You are not authorized to edit products for another store.");
        }

        product.UpdateDetails(request.Title, request.Price, request.MediaUrl, request.IsVideo, request.StockQuantity);
        await _db.SaveChangesAsync(ct);

        return new ProductDto(
            product.Id,
            product.MerchantId,
            product.Title,
            product.Price,
            product.MediaUrl,
            product.IsVideo,
            product.StockQuantity,
            product.CreatedAtUtc
        );
    }

    public async Task<bool> DeleteProductAsync(Guid merchantId, Guid productId, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product == null || product.MerchantId != merchantId)
        {
            return false;
        }

        _db.Products.Remove(product);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<SearchResponseDto> SearchAsync(string query, CancellationToken ct = default)
    {
        var raw = (query ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return new SearchResponseDto(string.Empty, false, null, Array.Empty<SearchResultItemDto>(), Array.Empty<SearchResultItemDto>());
        }

        // Fetch all active products and merchants for ranking & fuzzy fallback
        var allProductsQuery = from p in _db.Products.AsNoTracking()
                               join m in _db.Merchants.AsNoTracking() on p.MerchantId equals m.Id
                               where m.IsActive
                               select new
                               {
                                   p.Id,
                                   p.Title,
                                   p.Price,
                                   p.MediaUrl,
                                   p.IsVideo,
                                   StoreName = m.StoreName,
                                   StoreSlug = m.Slug
                               };

        var allProducts = await allProductsQuery.ToListAsync(ct);
        var allMerchants = await _db.Merchants.AsNoTracking().Where(m => m.IsActive).ToListAsync(ct);

        // 1. Direct Ranked Match (Exact, Prefix, Contains)
        var matchedProducts = new List<SearchResultItemDto>();
        foreach (var p in allProducts)
        {
            var titleLower = p.Title.ToLowerInvariant();
            var score = CalculateMatchScore(raw, titleLower);
            if (score > 0)
            {
                matchedProducts.Add(new SearchResultItemDto(
                    p.Id,
                    "Product",
                    p.Title,
                    $"by {p.StoreName}",
                    $"/merchants/{p.StoreSlug}",
                    p.Price,
                    p.MediaUrl,
                    p.IsVideo,
                    score
                ));
            }
        }

        var matchedMerchants = new List<SearchResultItemDto>();
        foreach (var m in allMerchants)
        {
            var nameLower = m.StoreName.ToLowerInvariant();
            var slugLower = m.Slug.ToLowerInvariant();
            var score = Math.Max(CalculateMatchScore(raw, nameLower), CalculateMatchScore(raw, slugLower));
            if (score > 0)
            {
                matchedMerchants.Add(new SearchResultItemDto(
                    m.Id,
                    "Merchant",
                    m.StoreName,
                    $"/{m.Slug}",
                    $"/merchants/{m.Slug}",
                    null,
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
                    false,
                    score
                ));
            }
        }

        // If direct matches exist, return sorted by rank
        if (matchedProducts.Count > 0 || matchedMerchants.Count > 0)
        {
            return new SearchResponseDto(
                raw,
                false,
                null,
                matchedProducts.OrderByDescending(x => x.MatchScore).ThenBy(x => x.Title).Take(10).ToList(),
                matchedMerchants.OrderByDescending(x => x.MatchScore).ThenBy(x => x.Title).Take(6).ToList()
            );
        }

        // 2. Fuzzy / Nearest Match Fallback (Levenshtein Distance)
        string? suggestedTerm = null;
        double bestSimilarity = 0.0;

        var fuzzyProducts = new List<(SearchResultItemDto Item, double Similarity)>();
        foreach (var p in allProducts)
        {
            var sim = CalculateLevenshteinSimilarity(raw, p.Title.ToLowerInvariant());
            if (sim >= 0.35)
            {
                if (sim > bestSimilarity)
                {
                    bestSimilarity = sim;
                    suggestedTerm = p.Title;
                }

                fuzzyProducts.Add((new SearchResultItemDto(
                    p.Id,
                    "Product",
                    p.Title,
                    $"Nearest discovery • {p.StoreName}",
                    $"/merchants/{p.StoreSlug}",
                    p.Price,
                    p.MediaUrl,
                    p.IsVideo,
                    (int)(sim * 100)
                ), sim));
            }
        }

        var fuzzyMerchants = new List<(SearchResultItemDto Item, double Similarity)>();
        foreach (var m in allMerchants)
        {
            var sim = Math.Max(
                CalculateLevenshteinSimilarity(raw, m.StoreName.ToLowerInvariant()),
                CalculateLevenshteinSimilarity(raw, m.Slug.ToLowerInvariant()));

            if (sim >= 0.35)
            {
                if (sim > bestSimilarity)
                {
                    bestSimilarity = sim;
                    suggestedTerm = m.StoreName;
                }

                fuzzyMerchants.Add((new SearchResultItemDto(
                    m.Id,
                    "Merchant",
                    m.StoreName,
                    $"Nearest store • /{m.Slug}",
                    $"/merchants/{m.Slug}",
                    null,
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
                    false,
                    (int)(sim * 100)
                ), sim));
            }
        }

        return new SearchResponseDto(
            raw,
            true,
            suggestedTerm,
            fuzzyProducts.OrderByDescending(x => x.Similarity).Select(x => x.Item).Take(10).ToList(),
            fuzzyMerchants.OrderByDescending(x => x.Similarity).Select(x => x.Item).Take(6).ToList()
        );
    }

    private static int CalculateMatchScore(string query, string target)
    {
        if (target == query) return 100;
        if (target.StartsWith(query)) return 80;
        if (target.Split(' ', StringSplitOptions.RemoveEmptyEntries).Any(w => w.StartsWith(query))) return 60;
        if (target.Contains(query)) return 40;
        return 0;
    }

    private static double CalculateLevenshteinSimilarity(string s, string t)
    {
        if (string.IsNullOrEmpty(s)) return string.IsNullOrEmpty(t) ? 1.0 : 0.0;
        if (string.IsNullOrEmpty(t)) return 0.0;

        // Substring / word-level match bonus
        var words = t.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var bestWordSim = 0.0;
        foreach (var word in words)
        {
            var d = Distance(s, word);
            var maxLen = Math.Max(s.Length, word.Length);
            var sim = maxLen == 0 ? 1.0 : 1.0 - ((double)d / maxLen);
            if (sim > bestWordSim) bestWordSim = sim;
        }

        var fullDist = Distance(s, t);
        var fullMax = Math.Max(s.Length, t.Length);
        var fullSim = fullMax == 0 ? 1.0 : 1.0 - ((double)fullDist / fullMax);

        return Math.Max(bestWordSim, fullSim);
    }

    private static int Distance(string s, string t)
    {
        var d = new int[s.Length + 1, t.Length + 1];
        for (var i = 0; i <= s.Length; i++) d[i, 0] = i;
        for (var j = 0; j <= t.Length; j++) d[0, j] = j;

        for (var j = 1; j <= t.Length; j++)
        {
            for (var i = 1; i <= s.Length; i++)
            {
                var cost = (s[i - 1] == t[j - 1]) ? 0 : 1;
                d[i, j] = Math.Min(
                    Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                    d[i - 1, j - 1] + cost);
            }
        }
        return d[s.Length, t.Length];
    }
}

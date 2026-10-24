using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using SocialCommerce.Api.Middleware;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace SocialCommerce.Tests;

public class ArchitectureAndServicesTests
{
    private static (SqliteConnection Connection, SocialCommerceDbContext Db) CreateSqliteInMemoryDb()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<SocialCommerceDbContext>()
            .UseSqlite(connection)
            .Options;

        var db = new SocialCommerceDbContext(options);
        db.Database.EnsureCreated();
        return (connection, db);
    }

    [Fact]
    public async Task HybridCacheService_SetAndGet_ReturnsCachedValueFromMemoryAndDistributed()
    {
        var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var distributedCache = new MemoryDistributedCache(Microsoft.Extensions.Options.Options.Create(new MemoryDistributedCacheOptions()));
        var cacheService = new HybridDistributedCacheService(memoryCache, distributedCache, NullLogger<HybridDistributedCacheService>.Instance);

        var key = "test:product:123";
        var payload = "Sample Cached Value";

        await cacheService.SetAsync(key, payload, TimeSpan.FromMinutes(5));

        var retrieved = await cacheService.GetAsync<string>(key);
        Assert.Equal(payload, retrieved);

        // Invalidate by prefix
        await cacheService.RemoveByPrefixAsync("test:product:");
        var afterRemove = await cacheService.GetAsync<string>(key);
        Assert.Null(afterRemove);
    }

    [Fact]
    public async Task BackgroundTaskQueue_QueueAndDequeue_ExecutesAsyncWork()
    {
        var queue = new BackgroundTaskQueue(10);
        var services = new ServiceCollection().BuildServiceProvider();

        var executed = false;
        await queue.QueueBackgroundWorkItemAsync((sp, ct) =>
        {
            executed = true;
            return ValueTask.CompletedTask;
        });

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
        var workItem = await queue.DequeueAsync(cts.Token);
        await workItem(services, cts.Token);

        Assert.True(executed);
    }

    [Fact]
    public void TenantContext_SetsAndExposesTenantState()
    {
        var tenantContext = new TenantContext();
        Assert.False(tenantContext.HasTenant);

        var tenantId = Guid.NewGuid();
        tenantContext.SetTenant(tenantId, "bazaar-cairo", "Bazaar Cairo");

        Assert.True(tenantContext.HasTenant);
        Assert.Equal(tenantId, tenantContext.TenantId);
        Assert.Equal("bazaar-cairo", tenantContext.TenantSlug);
        Assert.Equal("Bazaar Cairo", tenantContext.TenantName);
    }

    [Fact]
    public async Task TenantResolutionMiddleware_ResolvesFromHeader()
    {
        var (conn, db) = CreateSqliteInMemoryDb();
        using (conn)
        using (db)
        {
            var merchant = new Merchant("Artisan Leather", "artisan-leather", "artisan@shop.eg");
            db.Merchants.Add(merchant);
            await db.SaveChangesAsync();

            var tenantContext = new TenantContext();
            var middleware = new TenantResolutionMiddleware((ctx) => Task.CompletedTask, NullLogger<TenantResolutionMiddleware>.Instance);

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["X-Tenant-Slug"] = "artisan-leather";

            await middleware.InvokeAsync(httpContext, tenantContext, db);

            Assert.True(tenantContext.HasTenant);
            Assert.Equal(merchant.Id, tenantContext.TenantId);
            Assert.Equal("artisan-leather", tenantContext.TenantSlug);
            Assert.Equal("artisan-leather", httpContext.Response.Headers["X-Tenant-Context"].ToString());
        }
    }

    [Fact]
    public async Task TenantResolutionMiddleware_FallsBackToGlobalMarketplace_WhenNoHeaderPresent()
    {
        var (conn, db) = CreateSqliteInMemoryDb();
        using (conn)
        using (db)
        {
            var tenantContext = new TenantContext();
            var middleware = new TenantResolutionMiddleware((ctx) => Task.CompletedTask, NullLogger<TenantResolutionMiddleware>.Instance);

            var httpContext = new DefaultHttpContext();
            await middleware.InvokeAsync(httpContext, tenantContext, db);

            Assert.False(tenantContext.HasTenant);
            Assert.Equal("marketplace-global", httpContext.Response.Headers["X-Tenant-Context"].ToString());
        }
    }

    [Fact]
    public async Task DbInitializer_InitializesDatabase_Safely()
    {
        var (conn, db) = CreateSqliteInMemoryDb();
        using (conn)
        using (db)
        {
            await DbInitializer.InitializeAsync(db);
            Assert.True(await db.Merchants.AnyAsync());
            Assert.True(await db.Users.AnyAsync());
        }
    }
}

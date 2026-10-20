using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class ProductManagementAndSearchTests
{
    private static async Task<(SocialCommerceDbContext Db, SqliteConnection Conn, Merchant Merchant1, Merchant Merchant2, Product Product1)> SetupTestDbAsync()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SocialCommerceDbContext>()
            .UseSqlite(connection)
            .Options;

        var db = new SocialCommerceDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var m1 = new Merchant("Sari Boutique", "sari-boutique", "sari@example.com");
        var m2 = new Merchant("Cairo Leather Craft", "cairo-leather", "craft@example.com");
        db.Merchants.AddRange(m1, m2);
        await db.SaveChangesAsync();

        var p1 = new Product(m1.Id, "Oversized Beige Linen Shirt", 650m, "/uploads/shirt.jpg", false, 15);
        var p2 = new Product(m2.Id, "Handmade Genuine Leather Bag", 1250m, "/uploads/bag.jpg", false, 8);
        db.Products.AddRange(p1, p2);
        await db.SaveChangesAsync();

        return (db, connection, m1, m2, p1);
    }

    [Fact]
    public async Task UpdateProduct_AllowsOwner_AndUpdatesDetails()
    {
        var (db, conn, m1, _, p1) = await SetupTestDbAsync();
        using (conn)
        using (db)
        {
            var service = new CatalogService(db);
            var req = new UpdateProductRequest("Premium Linen Shirt (Updated)", 720m, "/uploads/new-shirt.jpg", true, 20);

            var updated = await service.UpdateProductAsync(m1.Id, p1.Id, req);

            Assert.Equal("Premium Linen Shirt (Updated)", updated.Title);
            Assert.Equal(720m, updated.Price);
            Assert.Equal("/uploads/new-shirt.jpg", updated.MediaUrl);
            Assert.True(updated.IsVideo);
            Assert.Equal(20, updated.StockQuantity);
        }
    }

    [Fact]
    public async Task UpdateProduct_BlocksCrossStoreEdit()
    {
        var (db, conn, _, m2, p1) = await SetupTestDbAsync();
        using (conn)
        using (db)
        {
            var service = new CatalogService(db);
            var req = new UpdateProductRequest("Hijacked Title", 100m, "/uploads/fake.jpg", false, 5);

            // Merchant 2 tries to edit Product 1 belonging to Merchant 1
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                service.UpdateProductAsync(m2.Id, p1.Id, req));
        }
    }

    [Fact]
    public async Task DeleteProduct_RemovesProductForOwner()
    {
        var (db, conn, m1, _, p1) = await SetupTestDbAsync();
        using (conn)
        using (db)
        {
            var service = new CatalogService(db);

            var deleted = await service.DeleteProductAsync(m1.Id, p1.Id);
            Assert.True(deleted);

            var inDb = await db.Products.FirstOrDefaultAsync(p => p.Id == p1.Id);
            Assert.Null(inDb);
        }
    }

    [Fact]
    public async Task Search_RanksExactAndContainsMatches_Correctly()
    {
        var (db, conn, _, _, _) = await SetupTestDbAsync();
        using (conn)
        using (db)
        {
            var service = new CatalogService(db);

            // Exact match query
            var result = await service.SearchAsync("linen");

            Assert.False(result.IsFuzzyMatch);
            Assert.NotEmpty(result.Products);
            Assert.Contains(result.Products, p => p.Title.Contains("Linen", StringComparison.OrdinalIgnoreCase));
        }
    }

    [Fact]
    public async Task Search_FallsBackToNearestFuzzyMatch_WhenTypoOccurs()
    {
        var (db, conn, _, _, _) = await SetupTestDbAsync();
        using (conn)
        using (db)
        {
            var service = new CatalogService(db);

            // Typo query: "linn" instead of "linen"
            var result = await service.SearchAsync("linn");

            Assert.True(result.IsFuzzyMatch);
            Assert.NotNull(result.SuggestedQuery);
            Assert.NotEmpty(result.Products);
            Assert.Equal("Oversized Beige Linen Shirt", result.Products[0].Title);
        }
    }
}

using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class ReviewServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly SocialCommerceDbContext _db;
    private readonly ReviewService _reviewService;

    public ReviewServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<SocialCommerceDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new SocialCommerceDbContext(options);
        _db.Database.EnsureCreated();

        _reviewService = new ReviewService(_db);
    }

    [Fact]
    public async Task AddReviewAsync_Should_Succeed_For_Verified_Purchase_And_Recalculate_Average()
    {
        var merchant = new Merchant("Sari Boutique", "sari", "sari@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Summer Scarf", 300m, "http://img.com/scarf.jpg", false, 10);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var order = new Order(
            merchant.Id,
            "Fatima",
            "fatima@example.com",
            "Cairo",
            new List<OrderItem> { new OrderItem(product.Id, product.Title, product.Price, 1) }
        );
        order.AssignPaymentOrderId("PAY-100");
        order.MarkAsPaid("TXN-100");
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var request = new CreateReviewRequest(
            order.Id,
            "Fatima",
            "fatima@example.com",
            5,
            "Exceptional pure linen fabric! Very soft and breathable."
        );

        var review = await _reviewService.AddReviewAsync(product.Id, request);

        Assert.NotNull(review);
        Assert.True(review.IsVerifiedPurchase);
        Assert.Equal(5, review.Rating);

        // Verify product aggregate rating
        var updatedProduct = await _db.Products.FindAsync(product.Id);
        Assert.Equal(1, updatedProduct!.ReviewCount);
        Assert.Equal(5.0, updatedProduct.RatingAverage);

        // Get reviews
        var reviews = await _reviewService.GetProductReviewsAsync(product.Id);
        Assert.Single(reviews);
    }

    [Fact]
    public async Task AddReviewAsync_Should_Throw_When_Order_Is_Not_Paid()
    {
        var merchant = new Merchant("Store", "slug", "email@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Bag", 400m, "http://img.com/bag.jpg", false, 5);
        _db.Products.Add(product);

        var pendingOrder = new Order(
            merchant.Id,
            "Buyer",
            "buyer@example.com",
            "Address",
            new List<OrderItem> { new OrderItem(product.Id, product.Title, product.Price, 1) }
        );
        _db.Orders.Add(pendingOrder);
        await _db.SaveChangesAsync();

        var request = new CreateReviewRequest(
            pendingOrder.Id,
            "Buyer",
            "buyer@example.com",
            4,
            "Nice bag"
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _reviewService.AddReviewAsync(product.Id, request)
        );
    }

    [Fact]
    public async Task AddReviewAsync_Should_Throw_When_Email_Mismatch()
    {
        var merchant = new Merchant("Store", "slug-2", "email2@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Shoes", 800m, "http://img.com/shoes.jpg", false, 3);
        _db.Products.Add(product);

        var order = new Order(
            merchant.Id,
            "Buyer",
            "original-buyer@example.com",
            "Address",
            new List<OrderItem> { new OrderItem(product.Id, product.Title, product.Price, 1) }
        );
        order.AssignPaymentOrderId("PAY-2");
        order.MarkAsPaid("TXN-2");
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var request = new CreateReviewRequest(
            order.Id,
            "Fake Buyer",
            "imposter@example.com",
            1,
            "Fake review"
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _reviewService.AddReviewAsync(product.Id, request)
        );
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}

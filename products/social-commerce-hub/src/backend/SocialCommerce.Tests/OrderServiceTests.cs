using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Payments;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Payments;
using SocialCommerce.Infrastructure.Payments.PayPal;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class OrderServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly SocialCommerceDbContext _db;
    private readonly IPaymentProviderFactory _paymentFactory;
    private readonly OrderService _orderService;

    public OrderServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<SocialCommerceDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new SocialCommerceDbContext(options);
        _db.Database.EnsureCreated();

        var provider = new PayPalPaymentProvider();
        _paymentFactory = new PaymentProviderFactory(new IPaymentProvider[] { provider });
        _orderService = new OrderService(_db, _paymentFactory);
    }

    [Fact]
    public async Task CreateOrderAsync_Should_Deduct_Stock_And_Assign_PaymentOrderId()
    {
        var merchant = new Merchant("Cairo Boutique", "cairo-boutique", "test@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Linen Shirt", 500m, "http://img.com/shirt.jpg", false, 10);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var request = new CreateOrderRequest(
            merchant.Id,
            "Youssef",
            "youssef@example.com",
            "Downtown Cairo",
            new List<CreateOrderItemRequest>
            {
                new CreateOrderItemRequest(product.Id, 2)
            }
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.NotNull(order);
        Assert.Equal(1000m, order.TotalAmount);
        Assert.Equal(50m, order.PlatformFeeAmount);
        Assert.Equal(950m, order.MerchantNetAmount);
        Assert.StartsWith("PAYPAL-ORDER-", order.PaymentOrderId);

        // Verify stock deducted
        var updatedProduct = await _db.Products.FindAsync(product.Id);
        Assert.Equal(8, updatedProduct!.StockQuantity);
    }

    [Fact]
    public async Task CaptureOrderAsync_Should_Mark_Order_Paid_And_Credit_Merchant_And_Record_Ledger()
    {
        var merchant = new Merchant("Cairo Boutique", "cairo-boutique", "test@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Leather Shoes", 1000m, "http://img.com/shoes.jpg", false, 5);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var createReq = new CreateOrderRequest(
            merchant.Id,
            "Sarah",
            "sarah@example.com",
            "Zamalek, Cairo",
            new List<CreateOrderItemRequest>
            {
                new CreateOrderItemRequest(product.Id, 1)
            }
        );

        var created = await _orderService.CreateOrderAsync(createReq);

        var captureResult = await _orderService.CaptureOrderAsync(
            created.Id,
            new CaptureOrderRequest(created.PaymentOrderId!, "PAYER-12345")
        );

        Assert.True(captureResult.IsSuccess);
        Assert.Equal("COMPLETED", captureResult.Status);
        Assert.NotNull(captureResult.Order);
        Assert.Equal("Paid", captureResult.Order.Status);

        // Verify Merchant Balance credited net amount (1000 - 50 fee = 950)
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(950m, updatedMerchant!.Balance);

        // Verify Ledger Entries
        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 1000m);
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 50m);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}

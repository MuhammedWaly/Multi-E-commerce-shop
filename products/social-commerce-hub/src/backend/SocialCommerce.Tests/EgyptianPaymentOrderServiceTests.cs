using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Payments;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Payments;
using SocialCommerce.Infrastructure.Payments.Egyptian;
using SocialCommerce.Infrastructure.Payments.PayPal;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class EgyptianPaymentOrderServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly SocialCommerceDbContext _db;
    private readonly IPaymentProviderFactory _paymentFactory;
    private readonly OrderService _orderService;

    public EgyptianPaymentOrderServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<SocialCommerceDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new SocialCommerceDbContext(options);
        _db.Database.EnsureCreated();

        var providers = new IPaymentProvider[]
        {
            new PayPalPaymentProvider(),
            new CashOnDeliveryPaymentProvider(),
            new FawryPaymentProvider(),
            new InstaPayPaymentProvider()
        };

        _paymentFactory = new PaymentProviderFactory(providers);
        _orderService = new OrderService(_db, _paymentFactory);
    }

    [Fact]
    public async Task CreateOrderAsync_With_COD_Should_Create_Pending_Order_Without_Upfront_Capture()
    {
        var merchant = new Merchant("Alexandria Store", "alex-store", "alex@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Cotton Hoodie", 800m, "http://img.com/hoodie.jpg", false, 15);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var request = new CreateOrderRequest(
            merchant.Id,
            "Tarek",
            "tarek@example.com",
            "Smouha, Alexandria",
            new List<CreateOrderItemRequest> { new CreateOrderItemRequest(product.Id, 2) },
            PaymentMethod: "CashOnDelivery"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.NotNull(order);
        Assert.Equal(1600m, order.TotalAmount);
        Assert.Equal(80m, order.PlatformFeeAmount); // 5% fee
        Assert.Equal(1520m, order.MerchantNetAmount); // 95% net
        Assert.Equal("Pending", order.Status);
        Assert.Equal("CashOnDelivery", order.PaymentMethod);
        Assert.StartsWith("COD-", order.PaymentOrderId);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
        Assert.Contains("courier", order.PaymentInstructions, StringComparison.OrdinalIgnoreCase);

        // Verify inventory stock deducted
        var updatedProduct = await _db.Products.FindAsync(product.Id);
        Assert.Equal(13, updatedProduct!.StockQuantity);
    }

    [Fact]
    public async Task CaptureOrderAsync_With_COD_Should_Transition_To_Paid_And_Credit_Merchant_Balance_And_Ledger()
    {
        var merchant = new Merchant("Cairo Boutique", "cairo-boutique-cod", "cod@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Silver Bracelet", 500m, "http://img.com/silver.jpg", false, 10);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var createReq = new CreateOrderRequest(
            merchant.Id,
            "Karim",
            "karim@example.com",
            "Heliopolis, Cairo",
            new List<CreateOrderItemRequest> { new CreateOrderItemRequest(product.Id, 1) },
            PaymentMethod: "COD"
        );

        var created = await _orderService.CreateOrderAsync(createReq);
        Assert.Equal("Pending", created.Status);

        var captureResult = await _orderService.CaptureOrderAsync(
            created.Id,
            new CaptureOrderRequest(created.PaymentOrderId!, "COURIER-DELIVERED")
        );

        Assert.True(captureResult.IsSuccess);
        Assert.Equal("COMPLETED", captureResult.Status);
        Assert.NotNull(captureResult.Order);
        Assert.Equal("Paid", captureResult.Order.Status);
        Assert.Equal("Settled", captureResult.Order.SettlementStatus);

        // Verify Merchant Balance credited net amount (500 - 25 = 475)
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(475m, updatedMerchant!.Balance);

        // Verify double-entry ledger records
        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 500m && l.Description.Contains("CashOnDelivery"));
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 25m);
    }

    [Fact]
    public async Task CreateOrderAsync_With_Fawry_Should_Generate_8Digit_BillRef_And_AwaitingPayment()
    {
        var merchant = new Merchant("Giza Crafts", "giza-crafts", "giza@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Papyrus Art", 600m, "http://img.com/art.jpg", false, 20);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var request = new CreateOrderRequest(
            merchant.Id,
            "Mona",
            "mona@example.com",
            "Dokki, Giza",
            new List<CreateOrderItemRequest> { new CreateOrderItemRequest(product.Id, 1) },
            PaymentMethod: "Fawry"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.NotNull(order);
        Assert.Equal(600m, order.TotalAmount);
        Assert.Equal(30m, order.PlatformFeeAmount);
        Assert.Equal(570m, order.MerchantNetAmount);
        Assert.Equal("AwaitingPayment", order.Status);
        Assert.Equal("Fawry", order.PaymentMethod);
        Assert.Equal(8, order.PaymentOrderId?.Length);
        Assert.Equal(order.PaymentOrderId, order.PaymentReference);
        Assert.NotNull(order.PaymentExpiresAtUtc);
        Assert.True(order.PaymentExpiresAtUtc > DateTime.UtcNow.AddHours(40));
        Assert.Contains("kiosk", order.PaymentInstructions, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
    }

    [Fact]
    public async Task CaptureOrderAsync_With_Fawry_Should_Transition_To_Paid_And_Credit_Merchant_And_Ledger()
    {
        var merchant = new Merchant("Nile Traders", "nile-traders", "nile@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Copper Tray", 1000m, "http://img.com/tray.jpg", false, 8);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Amr",
            "amr@example.com",
            "Nasr City, Cairo",
            new List<CreateOrderItemRequest> { new CreateOrderItemRequest(product.Id, 2) },
            PaymentMethod: "Fawry"
        ));

        Assert.Equal("AwaitingPayment", order.Status);

        var captureResult = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "FAWRY-KIOSK-SIMULATOR")
        );

        Assert.True(captureResult.IsSuccess);
        Assert.Equal("Paid", captureResult.Order!.Status);
        Assert.Equal("Settled", captureResult.Order.SettlementStatus);

        // 2000 total, 100 fee, 1900 net
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(1900m, updatedMerchant!.Balance);

        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 2000m);
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 100m);
    }

    [Fact]
    public async Task CreateOrderAsync_With_InstaPay_Should_Store_Sender_Wallet_And_Set_Processing()
    {
        var merchant = new Merchant("Mansoura Goods", "mansoura-goods", "mansoura@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Wool Blanket", 750m, "http://img.com/blanket.jpg", false, 12);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var request = new CreateOrderRequest(
            merchant.Id,
            "Hassan",
            "hassan@example.com",
            "Mansoura",
            new List<CreateOrderItemRequest> { new CreateOrderItemRequest(product.Id, 1) },
            PaymentMethod: "InstaPay",
            SenderWalletOrReference: "01001234567"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.NotNull(order);
        Assert.Equal("Processing", order.Status);
        Assert.Equal("InstaPay", order.PaymentMethod);
        Assert.StartsWith("INSTA-", order.PaymentOrderId);
        Assert.Equal("01001234567", order.SenderWalletOrReference);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
        Assert.Contains("InstaPay", order.PaymentInstructions);
    }

    [Fact]
    public async Task CaptureOrderAsync_With_InstaPay_Should_Transition_To_Paid_And_Credit_Merchant_And_Ledger()
    {
        var merchant = new Merchant("Aswan Spices", "aswan-spices", "aswan@store.com");
        _db.Merchants.Add(merchant);
        var product = new Product(merchant.Id, "Hibiscus Tea", 150m, "http://img.com/tea.jpg", false, 30);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Dina",
            "dina@example.com",
            "Aswan",
            new List<CreateOrderItemRequest> { new CreateOrderItemRequest(product.Id, 2) },
            PaymentMethod: "VodafoneCash",
            SenderWalletOrReference: "+201098765432"
        ));

        Assert.Equal("Processing", order.Status);

        var captureResult = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "+201098765432")
        );

        Assert.True(captureResult.IsSuccess);
        Assert.Equal("Paid", captureResult.Order!.Status);
        Assert.Equal("Settled", captureResult.Order.SettlementStatus);

        // 300 total, 15 fee, 285 net
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(285m, updatedMerchant!.Balance);

        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 300m);
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 15m);
    }

    [Fact]
    public void Order_MarkAsPaid_Should_Succeed_From_All_Valid_Egyptian_Statuses()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem> { new OrderItem(Guid.NewGuid(), "Item", 100m, 1) };

        // COD (Pending)
        var codOrder = new Order(merchantId, "C1", "c1@test.com", "Addr", items, 0.05m, "CashOnDelivery");
        Assert.Equal(OrderStatus.Pending, codOrder.Status);
        codOrder.MarkAsPaid("COD-TXN-1");
        Assert.Equal(OrderStatus.Paid, codOrder.Status);

        // Fawry (AwaitingPayment)
        var fawryOrder = new Order(merchantId, "C2", "c2@test.com", "Addr", items, 0.05m, "Fawry");
        Assert.Equal(OrderStatus.AwaitingPayment, fawryOrder.Status);
        fawryOrder.MarkAsPaid("FAWRY-TXN-1");
        Assert.Equal(OrderStatus.Paid, fawryOrder.Status);

        // InstaPay (Processing)
        var instaOrder = new Order(merchantId, "C3", "c3@test.com", "Addr", items, 0.05m, "InstaPay");
        Assert.Equal(OrderStatus.Processing, instaOrder.Status);
        instaOrder.MarkAsPaid("INSTA-TXN-1");
        Assert.Equal(OrderStatus.Paid, instaOrder.Status);

        // Already Paid cannot be marked paid again
        Assert.Throws<InvalidOperationException>(() => instaOrder.MarkAsPaid("INSTA-TXN-2"));
    }

    [Fact]
    public void Order_MarkAsFulfilled_Should_Succeed_For_COD_Pending_Order()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem> { new OrderItem(Guid.NewGuid(), "Item", 100m, 1) };
        var codOrder = new Order(merchantId, "C1", "c1@test.com", "Addr", items, 0.05m, "CashOnDelivery");

        codOrder.MarkAsFulfilled();
        Assert.Equal(OrderStatus.Fulfilled, codOrder.Status);
    }

    [Fact]
    public void Fee_Calculation_Preserves_Exact_5Percent_Platform_Fee_And_95Percent_Disbursement()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem>
        {
            new OrderItem(Guid.NewGuid(), "Item 1", 33.33m, 3), // 99.99
            new OrderItem(Guid.NewGuid(), "Item 2", 10.01m, 1)  // 10.01 -> Total: 110.00
        };

        var order = new Order(merchantId, "Customer", "c@test.com", "Addr", items, 0.05m, "Fawry");

        Assert.Equal(110.00m, order.TotalAmount);
        Assert.Equal(5.50m, order.PlatformFeeAmount); // 5% of 110.00
        Assert.Equal(104.50m, order.MerchantNetAmount); // 110.00 - 5.50
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}

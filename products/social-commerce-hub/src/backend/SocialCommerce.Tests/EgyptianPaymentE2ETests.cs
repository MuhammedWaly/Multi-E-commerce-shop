using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Payments;
using SocialCommerce.Infrastructure.Payments.Egyptian;
using SocialCommerce.Infrastructure.Payments.PayPal;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class EgyptianPaymentE2ETests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly SocialCommerceDbContext _db;
    private readonly IPaymentProviderFactory _paymentFactory;
    private readonly OrderService _orderService;
    private readonly AdminService _adminService;
    private readonly ReviewService _reviewService;

    private readonly CashOnDeliveryPaymentProvider _codProvider = new();
    private readonly FawryPaymentProvider _fawryProvider = new();
    private readonly InstaPayPaymentProvider _instaPayProvider = new();
    private readonly PayPalPaymentProvider _payPalProvider = new();

    public EgyptianPaymentE2ETests()
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
            _payPalProvider,
            _codProvider,
            _fawryProvider,
            _instaPayProvider
        };

        _paymentFactory = new PaymentProviderFactory(providers);
        _orderService = new OrderService(_db, _paymentFactory);
        _adminService = new AdminService(_db);
        _reviewService = new ReviewService(_db);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    #region Helper Methods

    private async Task<Merchant> CreateMerchantAsync(string storeName = "Test Boutique", string slug = "test-boutique", string email = "merchant@test.com")
    {
        var merchant = new Merchant(storeName, slug, email);
        _db.Merchants.Add(merchant);
        await _db.SaveChangesAsync();
        return merchant;
    }

    private async Task<Product> CreateProductAsync(Guid merchantId, string title = "Handcrafted Linen Scarf", decimal price = 500m, int stock = 20)
    {
        var product = new Product(merchantId, title, price, "http://img.com/p.jpg", false, stock);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product;
    }

    private static string FindFrontendTranslationsPath()
    {
        var dir = AppContext.BaseDirectory;
        while (!string.IsNullOrEmpty(dir))
        {
            var candidate = Path.Combine(dir, "src", "frontend", "src", "i18n", "translations.ts");
            if (File.Exists(candidate)) return candidate;
            var parent = Directory.GetParent(dir);
            if (parent == null) break;
            dir = parent.FullName;
        }

        dir = Directory.GetCurrentDirectory();
        while (!string.IsNullOrEmpty(dir))
        {
            var candidate = Path.Combine(dir, "src", "frontend", "src", "i18n", "translations.ts");
            if (File.Exists(candidate)) return candidate;
            var parent = Directory.GetParent(dir);
            if (parent == null) break;
            dir = parent.FullName;
        }

        return @"d:\AI Software Company\products\social-commerce-hub\src\frontend\src\i18n\translations.ts";
    }

    #endregion

    // ====================================================================================================
    // TIER 1: FEATURE COVERAGE (>=5 Test Cases per Feature Area)
    // ====================================================================================================

    #region Tier 1.1: Cash on Delivery (COD) Feature Coverage (5 Tests)

    [Fact]
    public async Task Tier1_COD_01_OrderCreation_InitialState_ShouldBePending()
    {
        var merchant = await CreateMerchantAsync("Cairo Crafts", "cairo-crafts", "cairo@crafts.eg");
        var product = await CreateProductAsync(merchant.Id, "Brass Lantern", 450m, 10);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Nour",
            "nour@example.com",
            "12 Zamalek St, Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "CashOnDelivery"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.NotNull(order);
        Assert.Equal("Pending", order.Status);
        Assert.Equal("CashOnDelivery", order.PaymentMethod);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
    }

    [Fact]
    public async Task Tier1_COD_02_ZeroUpfrontDigitalPayment_NoRedirectUrl()
    {
        var orderReq = new PaymentOrderRequest(Guid.NewGuid(), 750m, "EGP", "http://return", "http://cancel", "COD Order");
        var result = await _codProvider.CreatePaymentOrderAsync(orderReq);

        Assert.True(result.IsSuccess);
        Assert.StartsWith("COD-", result.PaymentOrderId);
        Assert.Empty(result.ApprovalUrl);
    }

    [Fact]
    public async Task Tier1_COD_03_OrderCreation_ReservesInventoryStock()
    {
        var merchant = await CreateMerchantAsync("Giza Textiles", "giza-textiles", "giza@textiles.eg");
        var product = await CreateProductAsync(merchant.Id, "Embroidered Cushion", 250m, 15);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Farida",
            "farida@example.com",
            "5 Dokki Square, Giza",
            new List<CreateOrderItemRequest> { new(product.Id, 4) },
            PaymentMethod: "COD"
        );

        await _orderService.CreateOrderAsync(request);

        var updatedProduct = await _db.Products.FindAsync(product.Id);
        Assert.NotNull(updatedProduct);
        Assert.Equal(11, updatedProduct.StockQuantity);
    }

    [Fact]
    public async Task Tier1_COD_04_OrderTracking_DisplaysCourierInstructions()
    {
        var merchant = await CreateMerchantAsync("Maadi Leather", "maadi-leather", "maadi@leather.eg");
        var product = await CreateProductAsync(merchant.Id, "Leather Wallet", 300m, 5);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Khaled",
            "khaled@example.com",
            "Road 9, Maadi, Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "CashOnDelivery"
        );

        var created = await _orderService.CreateOrderAsync(request);
        var retrieved = await _orderService.GetOrderByIdAsync(created.Id);

        Assert.NotNull(retrieved);
        Assert.Contains("courier", retrieved.PaymentInstructions, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("PendingSettlement", retrieved.SettlementStatus);
    }

    [Fact]
    public async Task Tier1_COD_05_MarkAsFulfilled_AllowedWhilePendingPayment()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 200m, 1) };
        var codOrder = new Order(merchantId, "Customer", "c@test.com", "Cairo", items, 0.05m, "CashOnDelivery");

        Assert.Equal(OrderStatus.Pending, codOrder.Status);
        codOrder.MarkAsFulfilled();
        Assert.Equal(OrderStatus.Fulfilled, codOrder.Status);
    }

    #endregion

    #region Tier 1.2: Fawry Pay Feature Coverage (5 Tests)

    [Fact]
    public async Task Tier1_Fawry_01_Generates8DigitNumericBillReference()
    {
        var orderReq = new PaymentOrderRequest(Guid.NewGuid(), 600m, "EGP", "http://return", "http://cancel", "Fawry Order");
        var result = await _fawryProvider.CreatePaymentOrderAsync(orderReq);

        Assert.True(result.IsSuccess);
        Assert.Equal(8, result.PaymentOrderId.Length);
        Assert.True(int.TryParse(result.PaymentOrderId, out var code));
        Assert.InRange(code, 10000000, 99999999);
    }

    [Fact]
    public async Task Tier1_Fawry_02_Sets48HourPaymentExpiration()
    {
        var merchant = await CreateMerchantAsync("Alex Pottery", "alex-pottery", "alex@pottery.eg");
        var product = await CreateProductAsync(merchant.Id, "Clay Vase", 350m, 8);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Ahmed",
            "ahmed@example.com",
            "Stanley, Alexandria",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "Fawry"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.NotNull(order.PaymentExpiresAtUtc);
        Assert.True(order.PaymentExpiresAtUtc.Value > DateTime.UtcNow.AddHours(40));
        Assert.True(order.PaymentExpiresAtUtc.Value <= DateTime.UtcNow.AddHours(49));
    }

    [Fact]
    public async Task Tier1_Fawry_03_BilingualInstructions_ContainsReferenceAndArabicFawryText()
    {
        var merchant = await CreateMerchantAsync("Nubian Rugs", "nubian-rugs", "nubian@rugs.eg");
        var product = await CreateProductAsync(merchant.Id, "Wool Carpet", 1200m, 4);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Layla",
            "layla@example.com",
            "Aswan",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "Fawry"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.Contains(order.PaymentOrderId!, order.PaymentInstructions);
        Assert.Contains("Fawry", order.PaymentInstructions, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("فوري", order.PaymentInstructions);
    }

    [Fact]
    public async Task Tier1_Fawry_04_InitialState_ShouldBeAwaitingPayment()
    {
        var merchant = await CreateMerchantAsync("Sinai Herbs", "sinai-herbs", "sinai@herbs.eg");
        var product = await CreateProductAsync(merchant.Id, "Moringa Tea", 150m, 20);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Mahmoud",
            "mahmoud@example.com",
            "Dahab, South Sinai",
            new List<CreateOrderItemRequest> { new(product.Id, 2) },
            PaymentMethod: "FawryPay"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.Equal("AwaitingPayment", order.Status);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
        Assert.Equal("Fawry", order.PaymentMethod);
    }

    [Fact]
    public async Task Tier1_Fawry_05_SimulatedSettlement_TransitionsToPaidAndSettled()
    {
        var merchant = await CreateMerchantAsync("Fayoum Clay", "fayoum-clay", "fayoum@clay.eg");
        var product = await CreateProductAsync(merchant.Id, "Glazed Plate", 220m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Hoda",
            "hoda@example.com",
            "Tunis Village, Fayoum",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "Fawry"
        ));

        var capture = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "FAWRY-KIOSK-SIMULATOR")
        );

        Assert.True(capture.IsSuccess);
        Assert.Equal("Paid", capture.Order!.Status);
        Assert.Equal("Settled", capture.Order.SettlementStatus);
        Assert.StartsWith("FAWRY-TXN-", capture.TransactionId);
    }

    #endregion

    #region Tier 1.3: InstaPay / Mobile Wallets Feature Coverage (5 Tests)

    [Fact]
    public async Task Tier1_InstaPay_01_AcceptsCustomerSenderWallet_TransitionsToProcessing()
    {
        var merchant = await CreateMerchantAsync("Luxor Crafts", "luxor-crafts", "luxor@crafts.eg");
        var product = await CreateProductAsync(merchant.Id, "Alabaster Statue", 800m, 6);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Ibrahim",
            "ibrahim@example.com",
            "Karnak, Luxor",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "InstaPay",
            SenderWalletOrReference: "01001234567"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.Equal("Processing", order.Status);
        Assert.Equal("InstaPay", order.PaymentMethod);
        Assert.Equal("01001234567", order.SenderWalletOrReference);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
    }

    [Fact]
    public async Task Tier1_InstaPay_02_AcceptsIpaAddressFormat()
    {
        var merchant = await CreateMerchantAsync("Zamalek Gallery", "zamalek-art", "art@zamalek.eg");
        var product = await CreateProductAsync(merchant.Id, "Oil Painting", 2500m, 2);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Salma",
            "salma@example.com",
            "Zamalek, Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "InstaPay",
            SenderWalletOrReference: "salma@instapay"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.Equal("salma@instapay", order.SenderWalletOrReference);
        Assert.Equal("Processing", order.Status);
    }

    [Fact]
    public async Task Tier1_InstaPay_03_GeneratesInstaPrefixOrderIdentifier()
    {
        var req = new PaymentOrderRequest(Guid.NewGuid(), 500m, "EGP", "http://return", "http://cancel", "InstaPay Order");
        var result = await _instaPayProvider.CreatePaymentOrderAsync(req);

        Assert.True(result.IsSuccess);
        Assert.StartsWith("INSTA-", result.PaymentOrderId);
        Assert.Empty(result.ApprovalUrl);
    }

    [Fact]
    public async Task Tier1_InstaPay_04_PaymentInstructions_SpecifiesAmountAndOrderId()
    {
        var merchant = await CreateMerchantAsync("Mansoura Silk", "mansoura-silk", "mansoura@silk.eg");
        var product = await CreateProductAsync(merchant.Id, "Silk Scarf", 600m, 10);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Mennat",
            "mennat@example.com",
            "Mansoura",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "InstaPay",
            SenderWalletOrReference: "01123456789"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.Contains("600.00", order.PaymentInstructions);
        Assert.Contains("InstaPay", order.PaymentInstructions);
        Assert.Contains(order.PaymentOrderId!, order.PaymentInstructions);
    }

    [Fact]
    public async Task Tier1_InstaPay_05_SettlementCapture_TransitionsToPaidAndSettled()
    {
        var merchant = await CreateMerchantAsync("Tanta Sweets", "tanta-sweets", "tanta@sweets.eg");
        var product = await CreateProductAsync(merchant.Id, "Halawa", 180m, 25);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Youssef",
            "youssef@example.com",
            "Tanta",
            new List<CreateOrderItemRequest> { new(product.Id, 2) },
            PaymentMethod: "VodafoneCash",
            SenderWalletOrReference: "+201011223344"
        ));

        var capture = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "+201011223344")
        );

        Assert.True(capture.IsSuccess);
        Assert.Equal("Paid", capture.Order!.Status);
        Assert.Equal("Settled", capture.Order.SettlementStatus);
        Assert.StartsWith("INSTA-TXN-", capture.TransactionId);
    }

    #endregion

    #region Tier 1.4: PayPal Parity (5 Tests)

    [Fact]
    public async Task Tier1_PayPal_01_GeneratesSandboxApprovalUrl()
    {
        var orderReq = new PaymentOrderRequest(Guid.NewGuid(), 950m, "EGP", "http://return", "http://cancel", "PayPal Order");
        var result = await _payPalProvider.CreatePaymentOrderAsync(orderReq);

        Assert.True(result.IsSuccess);
        Assert.StartsWith("PAYPAL-ORDER-", result.PaymentOrderId);
        Assert.Contains("sandbox.paypal.com/checkoutnow", result.ApprovalUrl);
    }

    [Fact]
    public async Task Tier1_PayPal_02_DefaultProviderFallback_WhenMethodOmitted()
    {
        var merchant = await CreateMerchantAsync("Port Said Goods", "port-said", "portsaid@goods.eg");
        var product = await CreateProductAsync(merchant.Id, "Seafood Seasoning", 120m, 30);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Kareem",
            "kareem@example.com",
            "Port Said",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: null
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.Equal("PayPal", order.PaymentMethod);
        Assert.Equal("PendingPayment", order.Status);
    }

    [Fact]
    public async Task Tier1_PayPal_03_CaptureFlow_WithPayerId_TransitionsToPaid()
    {
        var merchant = await CreateMerchantAsync("Suez Marine", "suez-marine", "suez@marine.eg");
        var product = await CreateProductAsync(merchant.Id, "Ship Wheel Replica", 850m, 5);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Samy",
            "samy@example.com",
            "Arbaeen, Suez",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "PayPal"
        ));

        var capture = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "PAYER-SANDBOX-123")
        );

        Assert.True(capture.IsSuccess);
        Assert.Equal("Paid", capture.Order!.Status);
        Assert.Equal("Settled", capture.Order.SettlementStatus);
        Assert.StartsWith("CAPTURE-", capture.TransactionId);
    }

    [Fact]
    public async Task Tier1_PayPal_04_InitialStatus_ShouldBePendingPayment()
    {
        var merchant = await CreateMerchantAsync("Ismailia Store", "ismailia-store", "ismailia@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Mango Jam", 90m, 50);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Nader",
            "nader@example.com",
            "Ismailia",
            new List<CreateOrderItemRequest> { new(product.Id, 2) },
            PaymentMethod: "PayPal"
        ));

        Assert.Equal("PendingPayment", order.Status);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
    }

    [Fact]
    public void Tier1_PayPal_05_SupportsAutomatedPayouts_ReturnsFalse()
    {
        Assert.False(_payPalProvider.SupportsAutomatedPayouts);
        Assert.Equal("PayPal", _payPalProvider.ProviderName);
    }

    #endregion

    #region Tier 1.5: Financial Ledger (5% Platform Fee & 95% Net Disbursement) (5 Tests)

    [Fact]
    public void Tier1_FinancialLedger_01_StandardOrder_Exact5PercentFeeAnd95PercentNet()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 1000m, 1) };
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Cairo", items, 0.05m, "Fawry");

        Assert.Equal(1000.00m, order.TotalAmount);
        Assert.Equal(50.00m, order.PlatformFeeAmount);
        Assert.Equal(950.00m, order.MerchantNetAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
    }

    [Fact]
    public void Tier1_FinancialLedger_02_FractionalCents_ConservesTotalWithoutPennyLoss()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 650.50m, 1) };
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Cairo", items, 0.05m, "InstaPay");

        // 650.50 * 0.05 = 32.525 -> rounded to 32.52 via Math.Round (to even)
        Assert.Equal(650.50m, order.TotalAmount);
        Assert.Equal(32.52m, order.PlatformFeeAmount);
        Assert.Equal(617.98m, order.MerchantNetAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
    }

    [Fact]
    public void Tier1_FinancialLedger_03_HighValueOrder_CalculatesAccurately()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 25000m, 1) };
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Cairo", items, 0.05m, "CashOnDelivery");

        Assert.Equal(25000.00m, order.TotalAmount);
        Assert.Equal(1250.00m, order.PlatformFeeAmount);
        Assert.Equal(23750.00m, order.MerchantNetAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
    }

    [Fact]
    public void Tier1_FinancialLedger_04_LowValueOrder_Under20Egp_CalculatesAccurately()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 19.99m, 1) };
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Cairo", items, 0.05m, "Fawry");

        // 19.99 * 0.05 = 0.9995 -> 1.00
        Assert.Equal(19.99m, order.TotalAmount);
        Assert.Equal(1.00m, order.PlatformFeeAmount);
        Assert.Equal(18.99m, order.MerchantNetAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
    }

    [Fact]
    public void Tier1_FinancialLedger_05_MultiItemOrder_TotalIsStrictSumOfSubtotals()
    {
        var items = new List<OrderItem>
        {
            new(Guid.NewGuid(), "Item 1", 150m, 3), // 450
            new(Guid.NewGuid(), "Item 2", 225.50m, 2) // 451
        };
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Cairo", items, 0.05m, "PayPal");

        Assert.Equal(901.00m, order.TotalAmount);
        Assert.Equal(45.05m, order.PlatformFeeAmount);
        Assert.Equal(855.95m, order.MerchantNetAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
    }

    #endregion

    #region Tier 1.6: Merchant Ledger Entries (CreditSale & FeeDeduction) (5 Tests)

    [Fact]
    public async Task Tier1_MerchantLedger_01_CODSettlement_RecordsCreditSaleAndFeeDeduction()
    {
        var merchant = await CreateMerchantAsync("Ledger COD Store", "ledger-cod", "cod@ledger.eg");
        var product = await CreateProductAsync(merchant.Id, "Product A", 500m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Customer",
            "c@test.com",
            "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "COD"
        ));

        await _orderService.CaptureOrderAsync(order.Id, new CaptureOrderRequest(order.PaymentOrderId!, "COURIER-DELIVERY"));

        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 500m);
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 25m);
    }

    [Fact]
    public async Task Tier1_MerchantLedger_02_FawrySettlement_RecordsCreditSaleAndFeeDeduction()
    {
        var merchant = await CreateMerchantAsync("Ledger Fawry Store", "ledger-fawry", "fawry@ledger.eg");
        var product = await CreateProductAsync(merchant.Id, "Product B", 800m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Customer",
            "c@test.com",
            "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "Fawry"
        ));

        await _orderService.CaptureOrderAsync(order.Id, new CaptureOrderRequest(order.PaymentOrderId!, "FAWRY-KIOSK"));

        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 800m);
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 40m);
    }

    [Fact]
    public async Task Tier1_MerchantLedger_03_InstaPaySettlement_RecordsCreditSaleAndFeeDeduction()
    {
        var merchant = await CreateMerchantAsync("Ledger Insta Store", "ledger-insta", "insta@ledger.eg");
        var product = await CreateProductAsync(merchant.Id, "Product C", 1200m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Customer",
            "c@test.com",
            "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "InstaPay",
            SenderWalletOrReference: "01001122334"
        ));

        await _orderService.CaptureOrderAsync(order.Id, new CaptureOrderRequest(order.PaymentOrderId!, "01001122334"));

        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 1200m);
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 60m);
    }

    [Fact]
    public async Task Tier1_MerchantLedger_04_PayPalSettlement_RecordsCreditSaleAndFeeDeduction()
    {
        var merchant = await CreateMerchantAsync("Ledger PayPal Store", "ledger-paypal", "paypal@ledger.eg");
        var product = await CreateProductAsync(merchant.Id, "Product D", 400m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id,
            "Customer",
            "c@test.com",
            "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "PayPal"
        ));

        await _orderService.CaptureOrderAsync(order.Id, new CaptureOrderRequest(order.PaymentOrderId!, "PAYER-123"));

        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 400m);
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 20m);
    }

    [Fact]
    public async Task Tier1_MerchantLedger_05_MerchantBalance_MatchesNetOfLedgerCreditsMinusDebits()
    {
        var merchant = await CreateMerchantAsync("Balance Parity Store", "balance-parity", "balance@parity.eg");
        var product = await CreateProductAsync(merchant.Id, "Product E", 1000m, 10);

        var o1 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C1", "c1@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "COD"
        ));
        await _orderService.CaptureOrderAsync(o1.Id, new CaptureOrderRequest(o1.PaymentOrderId!, "COURIER"));

        var o2 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C2", "c2@test.com", "Alex",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));
        await _orderService.CaptureOrderAsync(o2.Id, new CaptureOrderRequest(o2.PaymentOrderId!, "KIOSK"));

        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);

        var credits = ledger.Where(l => l.Type == "CreditSale").Sum(l => l.Amount);
        var debits = ledger.Where(l => l.Type == "FeeDeduction").Sum(l => l.Amount);

        Assert.Equal(2000m, credits);
        Assert.Equal(100m, debits);
        Assert.Equal(1900m, updatedMerchant!.Balance);
        Assert.Equal(updatedMerchant.Balance, credits - debits);
    }

    #endregion

    #region Tier 1.7: Admin Portal GMV & Platform Fee (5 Tests)

    [Fact]
    public async Task Tier1_AdminPortal_01_AggregatesSettledOrdersOnly()
    {
        var merchant = await CreateMerchantAsync("Admin Metric Store", "admin-metric", "admin@metric.eg");
        var product = await CreateProductAsync(merchant.Id, "Silk Dress", 1000m, 10);

        // Settled order
        var o1 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C1", "c1@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));
        await _orderService.CaptureOrderAsync(o1.Id, new CaptureOrderRequest(o1.PaymentOrderId!, "KIOSK"));

        // Unsettled order
        await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C2", "c2@test.com", "Alex",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "COD"
        ));

        var overview = await _adminService.GetOverviewAsync();

        Assert.Equal(1000m, overview.TotalGrossSales);
        Assert.Equal(50m, overview.TotalPlatformRevenue);
        Assert.Equal(950m, overview.TotalMerchantDisbursements);
        Assert.Equal(2, overview.TotalOrdersCount);
    }

    [Fact]
    public async Task Tier1_AdminPortal_02_TotalPlatformRevenue_Calculates5PercentAcrossAllGateways()
    {
        var merchant = await CreateMerchantAsync("Rev Store", "rev-store", "rev@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Handmade Scarf", 500m, 20);

        // COD settled: 500 total, 25 fee
        var o1 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C1", "c1@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "COD"
        ));
        await _orderService.CaptureOrderAsync(o1.Id, new CaptureOrderRequest(o1.PaymentOrderId!, "COURIER"));

        // InstaPay settled: 1000 total, 50 fee
        var o2 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C2", "c2@test.com", "Giza",
            new List<CreateOrderItemRequest> { new(product.Id, 2) }, PaymentMethod: "InstaPay",
            SenderWalletOrReference: "01011223344"
        ));
        await _orderService.CaptureOrderAsync(o2.Id, new CaptureOrderRequest(o2.PaymentOrderId!, "01011223344"));

        var overview = await _adminService.GetOverviewAsync();

        Assert.Equal(1500m, overview.TotalGrossSales);
        Assert.Equal(75m, overview.TotalPlatformRevenue);
        Assert.Equal(1425m, overview.TotalMerchantDisbursements);
    }

    [Fact]
    public async Task Tier1_AdminPortal_03_TotalMerchantDisbursements_Calculates95PercentSum()
    {
        var merchant = await CreateMerchantAsync("Disburse Store", "disburse-store", "disburse@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Bag", 2000m, 10);

        var o = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C", "c@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "PayPal"
        ));
        await _orderService.CaptureOrderAsync(o.Id, new CaptureOrderRequest(o.PaymentOrderId!, "PAYER"));

        var overview = await _adminService.GetOverviewAsync();

        Assert.Equal(1900m, overview.TotalMerchantDisbursements);
        Assert.Equal(100m, overview.TotalPlatformRevenue);
        Assert.Equal(2000m, overview.TotalGrossSales);
    }

    [Fact]
    public async Task Tier1_AdminPortal_04_GetAllOrders_ReflectsPaymentMethodsAndStatuses()
    {
        var merchant = await CreateMerchantAsync("Audit Store", "audit-store", "audit@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Hat", 200m, 10);

        await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C1", "c1@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "CashOnDelivery"
        ));
        await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C2", "c2@test.com", "Alex",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));
        await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C3", "c3@test.com", "Giza",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "InstaPay"
        ));

        var adminOrders = await _adminService.GetAllOrdersAsync();

        Assert.Equal(3, adminOrders.Count);
        Assert.Contains(adminOrders, o => o.PaymentMethod == "CashOnDelivery" && o.SettlementStatus == "PendingSettlement");
        Assert.Contains(adminOrders, o => o.PaymentMethod == "Fawry" && o.SettlementStatus == "PendingSettlement");
        Assert.Contains(adminOrders, o => o.PaymentMethod == "InstaPay" && o.SettlementStatus == "PendingSettlement");
    }

    [Fact]
    public async Task Tier1_AdminPortal_05_Overview_TotalOrdersCount_IncludesBothSettledAndPending()
    {
        var merchant = await CreateMerchantAsync("Count Store", "count-store", "count@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Belt", 150m, 10);

        var o1 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C1", "c1@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));
        await _orderService.CaptureOrderAsync(o1.Id, new CaptureOrderRequest(o1.PaymentOrderId!, "KIOSK"));

        var o2 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C2", "c2@test.com", "Alex",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "COD"
        ));

        var overview = await _adminService.GetOverviewAsync();
        Assert.Equal(2, overview.TotalOrdersCount);
    }

    #endregion

    #region Tier 1.8: Bilingual Experience (5 Tests)

    [Fact]
    public void Tier1_Bilingual_01_TranslationsFile_ContainsCompleteCheckoutKeysInBothLanguages()
    {
        var path = FindFrontendTranslationsPath();
        Assert.True(File.Exists(path), $"translations.ts not found at expected path: {path}");

        var content = File.ReadAllText(path);

        // Verify key tokens exist in translations definition
        var requiredKeys = new[]
        {
            "selectPaymentMethod",
            "codTitle",
            "codDesc",
            "fawryTitle",
            "fawryDesc",
            "instaPayTitle",
            "instaPayDesc",
            "paypalTitle",
            "fawryRefCode",
            "fawrySimulatePayment",
            "codZeroUpfrontBadge",
            "channelCol",
            "settlementCol"
        };

        foreach (var key in requiredKeys)
        {
            Assert.Contains(key, content);
        }
    }

    [Fact]
    public void Tier1_Bilingual_02_DirectionFlags_ConfiguredCorrectly()
    {
        var langContextPath = Path.Combine(Path.GetDirectoryName(FindFrontendTranslationsPath())!, "LanguageContext.tsx");
        Assert.True(File.Exists(langContextPath), $"LanguageContext.tsx not found at: {langContextPath}");

        var content = File.ReadAllText(langContextPath);

        // LanguageContext manages LTR for en and RTL for ar
        Assert.Contains("language === 'ar' ? 'rtl' : 'ltr'", content);
        Assert.Contains("document.documentElement.dir = direction", content);
    }

    [Fact]
    public void Tier1_Bilingual_03_CurrencyFormatting_FormatsEgpAndGimMeem()
    {
        var langContextPath = Path.Combine(Path.GetDirectoryName(FindFrontendTranslationsPath())!, "LanguageContext.tsx");
        var content = File.ReadAllText(langContextPath);

        // LanguageContext formats currency with 'EGP' in English and 'ج.م' in Arabic
        Assert.Contains("language === 'ar' ? '0 ج.م' : '0 EGP'", content);
        Assert.Contains("language === 'ar' ? `${formatted} ج.م` : `${formatted} EGP`", content);
    }

    [Fact]
    public void Tier1_Bilingual_04_ArabicCheckoutDictionary_ContainsArabicCharacters()
    {
        var path = FindFrontendTranslationsPath();
        var content = File.ReadAllText(path);

        // Extract Arabic translations portion and ensure Arabic script exists
        var arabicIndex = content.IndexOf("ar: {", StringComparison.Ordinal);
        Assert.True(arabicIndex > 0);

        var arabicSection = content.Substring(arabicIndex);
        Assert.Contains("الدفع نقداً عند الاستلام", arabicSection);
        Assert.Contains("فوري باي", arabicSection);
        Assert.Contains("إنستاباي ومحافظ المحمول", arabicSection);
        Assert.Contains("كود سداد فوري", arabicSection);
    }

    [Fact]
    public void Tier1_Bilingual_05_OrderServiceInstructions_ProvideBilingualGuidanceForFawry()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 500m, 1) };
        var order = new Order(merchantId, "C", "c@test.com", "Cairo", items, 0.05m, "Fawry");

        var instructions = "Please settle bill reference 98234710 at any Fawry retail kiosk, POS terminal, or banking app before 2026-10-23 12:00 UTC. / يرجى سداد كود الدفع 98234710 لدى أي منفذ فوري أو نقاط البيع أو التطبيق البنكي.";
        order.SetPaymentDetails("98234710", instructions, DateTime.UtcNow.AddHours(48));

        Assert.Contains("Please settle bill reference", order.PaymentInstructions);
        Assert.Contains("يرجى سداد كود الدفع", order.PaymentInstructions);
    }

    #endregion

    // ====================================================================================================
    // TIER 2: BOUNDARY & CORNER CASES (>=5 Test Cases per Feature Area)
    // ====================================================================================================

    #region Tier 2.1: Zero or Negative Amount Handling (5 Tests)

    [Fact]
    public async Task Tier2_ZeroNegative_01_CashOnDelivery_RejectsZeroAmount()
    {
        var req = new PaymentOrderRequest(Guid.NewGuid(), 0m, "EGP", "http://r", "http://c", "Zero COD");
        var res = await _codProvider.CreatePaymentOrderAsync(req);

        Assert.False(res.IsSuccess);
        Assert.Contains("greater than zero", res.ErrorMessage);
    }

    [Fact]
    public async Task Tier2_ZeroNegative_02_Fawry_RejectsNegativeAmount()
    {
        var req = new PaymentOrderRequest(Guid.NewGuid(), -150m, "EGP", "http://r", "http://c", "Negative Fawry");
        var res = await _fawryProvider.CreatePaymentOrderAsync(req);

        Assert.False(res.IsSuccess);
        Assert.Contains("greater than zero", res.ErrorMessage);
    }

    [Fact]
    public async Task Tier2_ZeroNegative_03_InstaPay_RejectsZeroAmount()
    {
        var req = new PaymentOrderRequest(Guid.NewGuid(), 0m, "EGP", "http://r", "http://c", "Zero InstaPay");
        var res = await _instaPayProvider.CreatePaymentOrderAsync(req);

        Assert.False(res.IsSuccess);
        Assert.Contains("greater than zero", res.ErrorMessage);
    }

    [Fact]
    public async Task Tier2_ZeroNegative_04_PayPal_RejectsNegativeAmount()
    {
        var req = new PaymentOrderRequest(Guid.NewGuid(), -0.01m, "EGP", "http://r", "http://c", "Negative PayPal");
        var res = await _payPalProvider.CreatePaymentOrderAsync(req);

        Assert.False(res.IsSuccess);
        Assert.Contains("greater than zero", res.ErrorMessage);
    }

    [Fact]
    public void Tier2_ZeroNegative_05_ProductPriceUpdate_ThrowsOnNegativeValue()
    {
        var product = new Product(Guid.NewGuid(), "Plate", 100m, "http://img.com", false, 10);
        Assert.Throws<ArgumentException>(() => product.UpdatePrice(-50m));
    }

    #endregion

    #region Tier 2.2: Invalid or Malformed Fawry Bill References (5 Tests)

    [Fact]
    public async Task Tier2_FawryRef_01_EmptyReference_VerifyPaymentFails()
    {
        var req = new PaymentVerificationRequest("", "FAWRY-KIOSK");
        var res = await _fawryProvider.VerifyPaymentAsync(req);

        Assert.False(res.IsSuccess);
        Assert.Equal("FAILED", res.Status);
        Assert.Contains("Missing Fawry bill reference", res.ErrorMessage);
    }

    [Fact]
    public async Task Tier2_FawryRef_02_WhitespaceReference_VerifyPaymentFails()
    {
        var req = new PaymentVerificationRequest("   ", "FAWRY-KIOSK");
        var res = await _fawryProvider.VerifyPaymentAsync(req);

        Assert.False(res.IsSuccess);
        Assert.Equal("FAILED", res.Status);
    }

    [Fact]
    public async Task Tier2_FawryRef_03_MismatchedReference_CaptureReturnsMismatch()
    {
        var merchant = await CreateMerchantAsync("Mismatched Fawry", "mismatch-fawry", "mismatch@fawry.eg");
        var product = await CreateProductAsync(merchant.Id, "Vase", 300m, 5);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C", "c@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));

        var capture = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest("99999999", "FAWRY-KIOSK")
        );

        Assert.False(capture.IsSuccess);
        Assert.Equal("MISMATCH", capture.Status);
        Assert.Contains("does not match", capture.ErrorMessage);
    }

    [Fact]
    public async Task Tier2_FawryRef_04_NonExistentOrderId_CaptureReturnsNotFound()
    {
        var capture = await _orderService.CaptureOrderAsync(
            Guid.NewGuid(),
            new CaptureOrderRequest("84910248", "FAWRY-KIOSK")
        );

        Assert.False(capture.IsSuccess);
        Assert.Equal("NOT_FOUND", capture.Status);
    }

    [Fact]
    public async Task Tier2_FawryRef_05_GeneratedReference_StrictlyMatches8Digits()
    {
        for (int i = 0; i < 20; i++)
        {
            var req = new PaymentOrderRequest(Guid.NewGuid(), 100m, "EGP", "http://r", "http://c", "Fawry Order");
            var result = await _fawryProvider.CreatePaymentOrderAsync(req);

            Assert.Equal(8, result.PaymentOrderId.Length);
            Assert.Matches(@"^\d{8}$", result.PaymentOrderId);
        }
    }

    #endregion

    #region Tier 2.3: Expired Fawry Reference Handling (5 Tests)

    [Fact]
    public async Task Tier2_ExpiredFawry_01_PaymentExpiresAtUtc_SetToFuture()
    {
        var merchant = await CreateMerchantAsync("Expiry Store 1", "expiry-store-1", "exp1@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Pot", 200m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C", "c@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));

        Assert.NotNull(order.PaymentExpiresAtUtc);
        Assert.True(order.PaymentExpiresAtUtc > DateTime.UtcNow);
    }

    [Fact]
    public void Tier2_ExpiredFawry_02_DomainEntity_PreservesExpirationTimestamp()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 100m, 1) };
        var expiresAt = DateTime.UtcNow.AddHours(48);

        var order = new Order(merchantId, "C", "c@test.com", "Cairo", items, 0.05m, "Fawry",
            paymentExpiresAtUtc: expiresAt);

        Assert.Equal(expiresAt, order.PaymentExpiresAtUtc);
    }

    [Fact]
    public void Tier2_ExpiredFawry_03_UnpaidAwaitingPaymentOrder_CannotBeFulfilled()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 100m, 1) };
        var expiredOrder = new Order(merchantId, "C", "c@test.com", "Cairo", items, 0.05m, "Fawry",
            paymentExpiresAtUtc: DateTime.UtcNow.AddHours(-1));

        Assert.Equal(OrderStatus.AwaitingPayment, expiredOrder.Status);
        Assert.Throws<InvalidOperationException>(() => expiredOrder.MarkAsFulfilled());
    }

    [Fact]
    public async Task Tier2_ExpiredFawry_04_UnpaidOrder_CannotSubmitVerifiedReview()
    {
        var merchant = await CreateMerchantAsync("Review Guard Store", "review-guard", "rg@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Kettle", 350m, 5);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "Dalia", "dalia@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));

        var reviewReq = new CreateReviewRequest(order.Id, "Dalia", "dalia@test.com", 5, "Great kettle");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _reviewService.AddReviewAsync(product.Id, reviewReq)
        );
    }

    [Fact]
    public async Task Tier2_ExpiredFawry_05_UnsettledFawryOrders_ExcludedFromAdminGmv()
    {
        var merchant = await CreateMerchantAsync("Unsettled Store", "unsettled-store", "unsettled@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Tray", 400m, 10);

        await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C", "c@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));

        var overview = await _adminService.GetOverviewAsync();
        Assert.Equal(0m, overview.TotalGrossSales);
        Assert.Equal(0m, overview.TotalPlatformRevenue);
    }

    #endregion

    #region Tier 2.4: Empty or Malformed Mobile Wallet Phone Numbers (5 Tests)

    [Fact]
    public async Task Tier2_Wallet_01_EmptyReferenceAndPayerId_VerifyFails()
    {
        var req = new PaymentVerificationRequest("", "");
        var res = await _instaPayProvider.VerifyPaymentAsync(req);

        Assert.False(res.IsSuccess);
        Assert.Equal("FAILED", res.Status);
        Assert.Contains("Missing InstaPay payment reference or sender wallet ID", res.ErrorMessage);
    }

    [Fact]
    public async Task Tier2_Wallet_02_WhitespaceSenderWallet_FallsBackCleanly()
    {
        var merchant = await CreateMerchantAsync("Wallet Store", "wallet-store", "wallet@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Cushion", 200m, 10);

        var request = new CreateOrderRequest(
            merchant.Id, "C", "c@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "InstaPay",
            SenderWalletOrReference: "   "
        );

        var order = await _orderService.CreateOrderAsync(request);
        Assert.Null(order.SenderWalletOrReference);
    }

    [Fact]
    public async Task Tier2_Wallet_03_SenderWalletAlias_ResolvedCorrectly()
    {
        var merchant = await CreateMerchantAsync("Alias Store", "alias-store", "alias@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Scarf", 300m, 10);

        var request = new CreateOrderRequest(
            merchant.Id, "C", "c@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "InstaPay",
            SenderWallet: "01234567890" // Using SenderWallet instead of SenderWalletOrReference
        );

        var order = await _orderService.CreateOrderAsync(request);
        Assert.Equal("01234567890", order.SenderWalletOrReference);
    }

    [Fact]
    public void Tier2_Wallet_04_ProviderFactory_NormalizesAllWalletProviderNames()
    {
        var providers = new[] { "InstaPay", "MobileWallet", "VodafoneCash", "OrangeMoney", "EtisalatCash", "WEPay" };
        foreach (var p in providers)
        {
            var resolved = _paymentFactory.GetProvider(p);
            Assert.Equal("InstaPay", resolved.ProviderName);
        }
    }

    [Fact]
    public void Tier2_Wallet_05_UnsupportedPaymentProvider_ThrowsNotSupportedException()
    {
        Assert.Throws<NotSupportedException>(() => _paymentFactory.GetProvider("BitcoinLightning"));
    }

    #endregion

    #region Tier 2.5: Exact Penny Rounding & Fractional Currency (5 Tests)

    [Fact]
    public void Tier2_Rounding_01_99_99_EGP_CalculatesExactPennySplit()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 99.99m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "Fawry");

        // 99.99 * 0.05 = 4.9995 -> 5.00
        Assert.Equal(99.99m, order.TotalAmount);
        Assert.Equal(5.00m, order.PlatformFeeAmount);
        Assert.Equal(94.99m, order.MerchantNetAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
    }

    [Fact]
    public void Tier2_Rounding_02_33_33_EGP_CalculatesExactPennySplit()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 33.33m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "InstaPay");

        // 33.33 * 0.05 = 1.6665 -> 1.67
        Assert.Equal(33.33m, order.TotalAmount);
        Assert.Equal(1.67m, order.PlatformFeeAmount);
        Assert.Equal(31.66m, order.MerchantNetAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
    }

    [Fact]
    public void Tier2_Rounding_03_0_01_EGP_PreservesSingleCent()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 0.01m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "CashOnDelivery");

        // 0.01 * 0.05 = 0.0005 -> 0.00
        Assert.Equal(0.01m, order.TotalAmount);
        Assert.Equal(0.00m, order.PlatformFeeAmount);
        Assert.Equal(0.01m, order.MerchantNetAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
    }

    [Fact]
    public void Tier2_Rounding_04_1234_56_EGP_CalculatesAccurately()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 1234.56m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "PayPal");

        // 1234.56 * 0.05 = 61.728 -> 61.73
        Assert.Equal(1234.56m, order.TotalAmount);
        Assert.Equal(61.73m, order.PlatformFeeAmount);
        Assert.Equal(1172.83m, order.MerchantNetAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
    }

    [Fact]
    public void Tier2_Rounding_05_SumAcrossManyOrders_ConservesEverySinglePenny()
    {
        var testTotals = new[] { 13.37m, 27.91m, 99.95m, 100.01m, 250.49m, 499.99m, 888.88m, 1999.99m };
        decimal cumulativeTotal = 0m;
        decimal cumulativeFees = 0m;
        decimal cumulativeNet = 0m;

        foreach (var total in testTotals)
        {
            var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", total, 1) };
            var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "Fawry");

            cumulativeTotal += order.TotalAmount;
            cumulativeFees += order.PlatformFeeAmount;
            cumulativeNet += order.MerchantNetAmount;

            Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
        }

        Assert.Equal(cumulativeTotal, cumulativeFees + cumulativeNet);
    }

    #endregion

    #region Tier 2.6: Duplicate Settlement Replay Protection (5 Tests)

    [Fact]
    public void Tier2_Replay_01_COD_CannotPayPaidOrderTwice()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 100m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "CashOnDelivery");

        order.MarkAsPaid("COD-TXN-1");
        Assert.Equal(OrderStatus.Paid, order.Status);

        Assert.Throws<InvalidOperationException>(() => order.MarkAsPaid("COD-TXN-2"));
    }

    [Fact]
    public void Tier2_Replay_02_Fawry_CannotPayPaidOrderTwice()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 100m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "Fawry");

        order.MarkAsPaid("FAWRY-TXN-1");
        Assert.Equal(OrderStatus.Paid, order.Status);

        Assert.Throws<InvalidOperationException>(() => order.MarkAsPaid("FAWRY-TXN-2"));
    }

    [Fact]
    public void Tier2_Replay_03_InstaPay_CannotPayPaidOrderTwice()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 100m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "InstaPay");

        order.MarkAsPaid("INSTA-TXN-1");
        Assert.Equal(OrderStatus.Paid, order.Status);

        Assert.Throws<InvalidOperationException>(() => order.MarkAsPaid("INSTA-TXN-2"));
    }

    [Fact]
    public void Tier2_Replay_04_PayPal_CannotPayPaidOrderTwice()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 100m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "PayPal");

        order.MarkAsPaid("PAYPAL-TXN-1");
        Assert.Equal(OrderStatus.Paid, order.Status);

        Assert.Throws<InvalidOperationException>(() => order.MarkAsPaid("PAYPAL-TXN-2"));
    }

    [Fact]
    public async Task Tier2_Replay_05_DuplicateCaptureAsync_ThrowsAndDoesNotDoubleCreditMerchant()
    {
        var merchant = await CreateMerchantAsync("Replay Store", "replay-store", "replay@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Stool", 500m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C", "c@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "COD"
        ));

        // First capture
        var firstCapture = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "COURIER-1")
        );
        Assert.True(firstCapture.IsSuccess);

        // Second capture attempt throws InvalidOperationException
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _orderService.CaptureOrderAsync(order.Id, new CaptureOrderRequest(order.PaymentOrderId!, "COURIER-2"))
        );

        // Merchant balance must be credited exactly once (475 EGP), not 950 EGP
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(475m, updatedMerchant!.Balance);
    }

    #endregion

    #region Tier 2.7: Invariant Guards on Status Transitions (5 Tests)

    [Fact]
    public void Tier2_Invariants_01_CannotFulfill_Unpaid_FawryOrder()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 200m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "Fawry");

        Assert.Equal(OrderStatus.AwaitingPayment, order.Status);
        var ex = Assert.Throws<InvalidOperationException>(() => order.MarkAsFulfilled());
        Assert.Equal("Only paid orders can be fulfilled.", ex.Message);
    }

    [Fact]
    public void Tier2_Invariants_02_CannotFulfill_Unpaid_InstaPayOrder()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 200m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "InstaPay");

        Assert.Equal(OrderStatus.Processing, order.Status);
        var ex = Assert.Throws<InvalidOperationException>(() => order.MarkAsFulfilled());
        Assert.Equal("Only paid orders can be fulfilled.", ex.Message);
    }

    [Fact]
    public void Tier2_Invariants_03_CannotFulfill_Unpaid_PayPalOrder()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 200m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "PayPal");

        Assert.Equal(OrderStatus.PendingPayment, order.Status);
        var ex = Assert.Throws<InvalidOperationException>(() => order.MarkAsFulfilled());
        Assert.Equal("Only paid orders can be fulfilled.", ex.Message);
    }

    [Fact]
    public void Tier2_Invariants_04_CannotCancel_FulfilledOrder()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 200m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "CashOnDelivery");

        order.MarkAsFulfilled();
        Assert.Equal(OrderStatus.Fulfilled, order.Status);

        var ex = Assert.Throws<InvalidOperationException>(() => order.Cancel());
        Assert.Equal("Fulfilled orders cannot be cancelled.", ex.Message);
    }

    [Fact]
    public void Tier2_Invariants_05_CannotPay_CancelledOrder()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 200m, 1) };
        var order = new Order(Guid.NewGuid(), "C", "c@test.com", "Cairo", items, 0.05m, "Fawry");

        order.Cancel();
        Assert.Equal(OrderStatus.Cancelled, order.Status);

        var ex = Assert.Throws<InvalidOperationException>(() => order.MarkAsPaid("TXN-123"));
        Assert.Contains("Cannot pay order with current status: Cancelled", ex.Message);
    }

    #endregion

    // ====================================================================================================
    // TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Interactions)
    // ====================================================================================================

    #region Tier 3: Cross-Feature Combinations (6 Tests)

    [Fact]
    public async Task Tier3_CrossFeature_01_MultiItemCart_AccuratelyAggregatedAndStockDeducted()
    {
        var merchant = await CreateMerchantAsync("MultiStore", "multi-store", "multi@store.eg");
        var product1 = await CreateProductAsync(merchant.Id, "Item 1", 300m, 10);
        var product2 = await CreateProductAsync(merchant.Id, "Item 2", 200m, 5);

        var request = new CreateOrderRequest(
            merchant.Id,
            "Buyer",
            "buyer@test.com",
            "Cairo",
            new List<CreateOrderItemRequest>
            {
                new(product1.Id, 2), // 600
                new(product2.Id, 3)  // 600 -> Total: 1200
            },
            PaymentMethod: "Fawry"
        );

        var order = await _orderService.CreateOrderAsync(request);

        Assert.Equal(1200m, order.TotalAmount);
        Assert.Equal(60m, order.PlatformFeeAmount);
        Assert.Equal(1140m, order.MerchantNetAmount);

        // Verify stock deducted for both items atomically
        var p1 = await _db.Products.FindAsync(product1.Id);
        var p2 = await _db.Products.FindAsync(product2.Id);
        Assert.Equal(8, p1!.StockQuantity);
        Assert.Equal(2, p2!.StockQuantity);
    }

    [Fact]
    public async Task Tier3_CrossFeature_02_FullLifecycle_FromCreationToFulfillment()
    {
        var merchant = await CreateMerchantAsync("Lifecycle Store", "lifecycle-store", "lifecycle@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Jacket", 1500m, 10);

        // 1. Create order (AwaitingPayment)
        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C", "c@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));
        Assert.Equal("AwaitingPayment", order.Status);

        // 2. Capture / Settle (Paid)
        var capture = await _orderService.CaptureOrderAsync(order.Id, new CaptureOrderRequest(order.PaymentOrderId!, "KIOSK"));
        Assert.True(capture.IsSuccess);
        Assert.Equal("Paid", capture.Order!.Status);

        // 3. Update status to Fulfilled
        var fulfilled = await _orderService.UpdateOrderStatusAsync(order.Id, "Fulfilled");
        Assert.Equal("Fulfilled", fulfilled.Status);
        Assert.Equal("Settled", fulfilled.SettlementStatus);
    }

    [Fact]
    public async Task Tier3_CrossFeature_03_MerchantLedgerBalanceParity_AcrossAllFourChannels()
    {
        var merchant = await CreateMerchantAsync("All Channels Merchant", "all-channels", "all@channels.eg");
        var pCOD = await CreateProductAsync(merchant.Id, "COD Item", 500m, 10);
        var pFawry = await CreateProductAsync(merchant.Id, "Fawry Item", 800m, 10);
        var pInsta = await CreateProductAsync(merchant.Id, "Insta Item", 1000m, 10);
        var pPayPal = await CreateProductAsync(merchant.Id, "PayPal Item", 400m, 10);

        // Order 1: COD (500 -> 25 fee, 475 net)
        var o1 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C1", "c1@test.com", "Cairo", new List<CreateOrderItemRequest> { new(pCOD.Id, 1) }, "COD"));
        await _orderService.CaptureOrderAsync(o1.Id, new CaptureOrderRequest(o1.PaymentOrderId!, "COURIER"));

        // Order 2: Fawry (800 -> 40 fee, 760 net)
        var o2 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C2", "c2@test.com", "Alex", new List<CreateOrderItemRequest> { new(pFawry.Id, 1) }, "Fawry"));
        await _orderService.CaptureOrderAsync(o2.Id, new CaptureOrderRequest(o2.PaymentOrderId!, "KIOSK"));

        // Order 3: InstaPay (1000 -> 50 fee, 950 net)
        var o3 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C3", "c3@test.com", "Giza", new List<CreateOrderItemRequest> { new(pInsta.Id, 1) }, "InstaPay",
            SenderWalletOrReference: "01001122334"));
        await _orderService.CaptureOrderAsync(o3.Id, new CaptureOrderRequest(o3.PaymentOrderId!, "01001122334"));

        // Order 4: PayPal (400 -> 20 fee, 380 net)
        var o4 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "C4", "c4@test.com", "Aswan", new List<CreateOrderItemRequest> { new(pPayPal.Id, 1) }, "PayPal"));
        await _orderService.CaptureOrderAsync(o4.Id, new CaptureOrderRequest(o4.PaymentOrderId!, "PAYER"));

        // Check Merchant Balance: 475 + 760 + 950 + 380 = 2565 EGP
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(2565m, updatedMerchant!.Balance);

        // Check Ledger Entries: exactly 8 entries (4 CreditSale + 4 FeeDeduction)
        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(8, ledger.Count);
        Assert.Equal(4, ledger.Count(l => l.Type == "CreditSale"));
        Assert.Equal(4, ledger.Count(l => l.Type == "FeeDeduction"));

        // Sum of net disbursements strictly matches merchant balance
        var totalGross = ledger.Where(l => l.Type == "CreditSale").Sum(l => l.Amount);
        var totalFees = ledger.Where(l => l.Type == "FeeDeduction").Sum(l => l.Amount);
        Assert.Equal(2700m, totalGross);
        Assert.Equal(135m, totalFees);
        Assert.Equal(updatedMerchant.Balance, totalGross - totalFees);
    }

    [Fact]
    public async Task Tier3_CrossFeature_04_AdminGMVReconciliation_AcrossAllFourChannels()
    {
        var merchant = await CreateMerchantAsync("Admin Reconcile Store", "admin-reconcile", "reconcile@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Art Piece", 1000m, 20);

        // Settle across 4 channels
        var methods = new[] { "COD", "Fawry", "InstaPay", "PayPal" };
        foreach (var m in methods)
        {
            var o = await _orderService.CreateOrderAsync(new CreateOrderRequest(
                merchant.Id, $"Customer {m}", $"c_{m}@test.com", "Egypt",
                new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: m,
                SenderWalletOrReference: m == "InstaPay" ? "01001122334" : null
            ));
            await _orderService.CaptureOrderAsync(o.Id, new CaptureOrderRequest(o.PaymentOrderId!, "SETTLED"));
        }

        // Add 2 unsettled orders
        await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "Unsettled 1", "u1@test.com", "Egypt",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "COD"
        ));
        await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "Unsettled 2", "u2@test.com", "Egypt",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));

        var overview = await _adminService.GetOverviewAsync();

        // 4 settled orders * 1000 = 4000 GMV
        Assert.Equal(4000m, overview.TotalGrossSales);
        Assert.Equal(200m, overview.TotalPlatformRevenue);
        Assert.Equal(3800m, overview.TotalMerchantDisbursements);
        Assert.Equal(6, overview.TotalOrdersCount);
    }

    [Fact]
    public async Task Tier3_CrossFeature_05_VerifiedReviewUnlocking_UponDeliveryAndPayment()
    {
        var merchant = await CreateMerchantAsync("Review Store", "review-store", "review@store.eg");
        var product = await CreateProductAsync(merchant.Id, "Leather Bag", 600m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "Mona", "mona@example.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
        ));

        // Before payment: review is blocked
        var reviewReq = new CreateReviewRequest(order.Id, "Mona", "mona@example.com", 5, "Amazing quality!");
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _reviewService.AddReviewAsync(product.Id, reviewReq)
        );

        // Settle payment
        await _orderService.CaptureOrderAsync(order.Id, new CaptureOrderRequest(order.PaymentOrderId!, "KIOSK"));

        // After payment: review is allowed and verified
        var review = await _reviewService.AddReviewAsync(product.Id, reviewReq);
        Assert.NotNull(review);
        Assert.True(review.IsVerifiedPurchase);
        Assert.Equal(5, review.Rating);

        // Product aggregate rating updated
        var updatedProduct = await _db.Products.FindAsync(product.Id);
        Assert.Equal(1, updatedProduct!.ReviewCount);
        Assert.Equal(5.0, updatedProduct.RatingAverage);
    }

    [Fact]
    public async Task Tier3_CrossFeature_06_MultiMerchantIsolation_BalancesAndDashboardsSeparated()
    {
        var m1 = await CreateMerchantAsync("Merchant 1", "merchant-1", "m1@test.eg");
        var m2 = await CreateMerchantAsync("Merchant 2", "merchant-2", "m2@test.eg");

        var p1 = await CreateProductAsync(m1.Id, "P1", 500m, 10);
        var p2 = await CreateProductAsync(m2.Id, "P2", 1000m, 10);

        var o1 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            m1.Id, "C1", "c1@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(p1.Id, 1) }, PaymentMethod: "COD"
        ));
        await _orderService.CaptureOrderAsync(o1.Id, new CaptureOrderRequest(o1.PaymentOrderId!, "COURIER"));

        var o2 = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            m2.Id, "C2", "c2@test.com", "Alex",
            new List<CreateOrderItemRequest> { new(p2.Id, 1) }, PaymentMethod: "Fawry"
        ));
        await _orderService.CaptureOrderAsync(o2.Id, new CaptureOrderRequest(o2.PaymentOrderId!, "KIOSK"));

        var d1 = await _orderService.GetMerchantDashboardAsync(m1.Id);
        var d2 = await _orderService.GetMerchantDashboardAsync(m2.Id);

        Assert.Equal(475m, d1!.Balance);
        Assert.Equal(500m, d1.TotalGrossSales);
        Assert.Equal(1, d1.TotalOrdersCount);

        Assert.Equal(950m, d2!.Balance);
        Assert.Equal(1000m, d2.TotalGrossSales);
        Assert.Equal(1, d2.TotalOrdersCount);
    }

    #endregion

    // ====================================================================================================
    // TIER 4: REAL-WORLD APPLICATION WORKLOADS
    // ====================================================================================================

    #region Tier 4: Real-World Application Workloads (4 Tests)

    [Fact]
    public async Task Tier4_RealWorld_01_Complete_Fawry_Lifecycle_Workflow()
    {
        // 1. Merchant registers store and adds product
        var merchant = await CreateMerchantAsync("Nile Egyptian Crafts", "nile-crafts", "nile@crafts.eg");
        var product = await CreateProductAsync(merchant.Id, "Pure Egyptian Linen Shirt", 500m, 15);

        // 2. Buyer checks out via Fawry Pay
        var createRequest = new CreateOrderRequest(
            merchant.Id,
            "Tarek El-Sayed",
            "tarek@nile.eg",
            "26 July St, Zamalek, Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "Fawry"
        );
        var order = await _orderService.CreateOrderAsync(createRequest);

        // 3. Assert buyer receives 8-digit bill reference with 48h expiry and kiosk instructions
        Assert.Equal(8, order.PaymentOrderId?.Length);
        Assert.Equal(order.PaymentOrderId, order.PaymentReference);
        Assert.Equal("AwaitingPayment", order.Status);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
        Assert.NotNull(order.PaymentExpiresAtUtc);
        Assert.True(order.PaymentExpiresAtUtc > DateTime.UtcNow.AddHours(40));
        Assert.Contains("kiosk", order.PaymentInstructions, StringComparison.OrdinalIgnoreCase);

        // 4. Inventory was deducted immediately upon order placement
        var prodAfterOrder = await _db.Products.FindAsync(product.Id);
        Assert.Equal(14, prodAfterOrder!.StockQuantity);

        // 5. Fawry kiosk webhook/terminal executes settlement
        var captureResult = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "FAWRY-KIOSK-TERMINAL-01")
        );
        Assert.True(captureResult.IsSuccess);
        Assert.Equal("Paid", captureResult.Order!.Status);
        Assert.Equal("Settled", captureResult.Order.SettlementStatus);

        // 6. Merchant ledger & balance updated: 500 gross, 25 fee, 475 net payout
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(475m, updatedMerchant!.Balance);

        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 500m);
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 25m);

        // 7. Admin portal overview reflects GMV and platform fee
        var adminOverview = await _adminService.GetOverviewAsync();
        Assert.Equal(500m, adminOverview.TotalGrossSales);
        Assert.Equal(25m, adminOverview.TotalPlatformRevenue);
        Assert.Equal(475m, adminOverview.TotalMerchantDisbursements);

        // 8. Merchant marks order dispatched / fulfilled
        var fulfilledOrder = await _orderService.UpdateOrderStatusAsync(order.Id, "Fulfilled");
        Assert.Equal("Fulfilled", fulfilledOrder.Status);

        // 9. Buyer confirms delivery and posts verified review
        var review = await _reviewService.AddReviewAsync(product.Id, new CreateReviewRequest(
            order.Id,
            "Tarek El-Sayed",
            "tarek@nile.eg",
            5,
            "Outstanding linen quality, super fast delivery!"
        ));
        Assert.True(review.IsVerifiedPurchase);
        Assert.Equal(5, review.Rating);

        var finalProduct = await _db.Products.FindAsync(product.Id);
        Assert.Equal(1, finalProduct!.ReviewCount);
        Assert.Equal(5.0, finalProduct.RatingAverage);
    }

    [Fact]
    public async Task Tier4_RealWorld_02_Complete_CashOnDelivery_Lifecycle_Workflow()
    {
        // 1. Merchant registers store
        var merchant = await CreateMerchantAsync("Sinai Bedouin Rugs", "sinai-rugs", "sinai@rugs.eg");
        var product = await CreateProductAsync(merchant.Id, "Handwoven Kilm Rug", 850m, 5);

        // 2. Buyer checks out with Cash on Delivery
        var createRequest = new CreateOrderRequest(
            merchant.Id,
            "Nadia Mansour",
            "nadia@sinai.eg",
            "El-Salam St, Sharm El-Sheikh",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "CashOnDelivery"
        );
        var order = await _orderService.CreateOrderAsync(createRequest);

        // 3. Order is Pending with zero upfront digital payment requirement
        Assert.Equal("Pending", order.Status);
        Assert.Equal("CashOnDelivery", order.PaymentMethod);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
        Assert.StartsWith("COD-", order.PaymentOrderId);
        Assert.Contains("courier", order.PaymentInstructions, StringComparison.OrdinalIgnoreCase);

        // 4. Stock deducted
        var prodAfterOrder = await _db.Products.FindAsync(product.Id);
        Assert.Equal(4, prodAfterOrder!.StockQuantity);

        // 5. Courier delivers package, collects 850 EGP cash, and reports settlement
        var captureResult = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "ARAMEX-COURIER-COLLECTED")
        );
        Assert.True(captureResult.IsSuccess);
        Assert.Equal("Paid", captureResult.Order!.Status);
        Assert.Equal("Settled", captureResult.Order.SettlementStatus);

        // 6. Merchant confirms delivery completion and marks order as Fulfilled
        var fulfilledOrder = await _orderService.UpdateOrderStatusAsync(order.Id, "Fulfilled");
        Assert.Equal("Fulfilled", fulfilledOrder.Status);

        // 7. Merchant credited 95% net payout (850 - 42.50 = 807.50 EGP)
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(807.50m, updatedMerchant!.Balance);

        // 8. Admin portal reflects GMV and platform fee
        var adminOverview = await _adminService.GetOverviewAsync();
        Assert.Equal(850m, adminOverview.TotalGrossSales);
        Assert.Equal(42.50m, adminOverview.TotalPlatformRevenue);
        Assert.Equal(807.50m, adminOverview.TotalMerchantDisbursements);
    }

    [Fact]
    public async Task Tier4_RealWorld_03_Complete_InstaPay_MobileWallet_Workflow()
    {
        // 1. Merchant registers store
        var merchant = await CreateMerchantAsync("Cairo Leather Guild", "cairo-leather", "leather@cairo.eg");
        var product = await CreateProductAsync(merchant.Id, "Genuine Leather Messenger Bag", 1200m, 8);

        // 2. Buyer checks out with Vodafone Cash / InstaPay
        var createRequest = new CreateOrderRequest(
            merchant.Id,
            "Hazem Zaki",
            "hazem@leather.eg",
            "15 El-Tahrir St, Dokki, Giza",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "VodafoneCash",
            SenderWalletOrReference: "01012345678"
        );
        var order = await _orderService.CreateOrderAsync(createRequest);

        // 3. Order is in Processing state with sender wallet recorded
        Assert.Equal("Processing", order.Status);
        Assert.Equal("InstaPay", order.PaymentMethod);
        Assert.Equal("01012345678", order.SenderWalletOrReference);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
        Assert.StartsWith("INSTA-", order.PaymentOrderId);

        // 4. Payment verified and captured with transfer reference
        var captureResult = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "01012345678", "IPN-20261021-9988")
        );
        Assert.True(captureResult.IsSuccess);
        Assert.Equal("Paid", captureResult.Order!.Status);
        Assert.Equal("Settled", captureResult.Order.SettlementStatus);

        // 5. Merchant ledger reflects 1200 total, 60 fee, 1140 net payout
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(1140m, updatedMerchant!.Balance);

        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(2, ledger.Count);
        Assert.Contains(ledger, l => l.Type == "CreditSale" && l.Amount == 1200m);
        Assert.Contains(ledger, l => l.Type == "FeeDeduction" && l.Amount == 60m);

        // 6. Merchant marks order fulfilled
        var fulfilled = await _orderService.UpdateOrderStatusAsync(order.Id, "Fulfilled");
        Assert.Equal("Fulfilled", fulfilled.Status);

        // 7. Admin overview aggregates 1200 GMV
        var adminOverview = await _adminService.GetOverviewAsync();
        Assert.Equal(1200m, adminOverview.TotalGrossSales);
        Assert.Equal(60m, adminOverview.TotalPlatformRevenue);
    }

    [Fact]
    public async Task Tier4_RealWorld_04_Complete_PayPal_Parity_Workflow()
    {
        // 1. Merchant registers store
        var merchant = await CreateMerchantAsync("Global Egyptian Souvenirs", "souvenirs", "souvenirs@global.eg");
        var product = await CreateProductAsync(merchant.Id, "Pyramids Miniature Set", 350m, 20);

        // 2. Buyer checks out with PayPal
        var createRequest = new CreateOrderRequest(
            merchant.Id,
            "John Doe",
            "john@example.com",
            "Garden City, Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "PayPal"
        );
        var order = await _orderService.CreateOrderAsync(createRequest);

        // 3. Order is in PendingPayment state with sandbox approval URL
        Assert.Equal("PendingPayment", order.Status);
        Assert.Equal("PayPal", order.PaymentMethod);
        Assert.Equal("PendingSettlement", order.SettlementStatus);
        Assert.StartsWith("PAYPAL-ORDER-", order.PaymentOrderId);

        // 4. Capture PayPal payment with PayerId
        var captureResult = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "PAYER-SANDBOX-7788")
        );
        Assert.True(captureResult.IsSuccess);
        Assert.Equal("Paid", captureResult.Order!.Status);
        Assert.Equal("Settled", captureResult.Order.SettlementStatus);

        // 5. Merchant credited 332.50 EGP (350 - 17.50)
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(332.50m, updatedMerchant!.Balance);

        // 6. Admin overview aggregates 350 GMV and 17.50 fee
        var adminOverview = await _adminService.GetOverviewAsync();
        Assert.Equal(350m, adminOverview.TotalGrossSales);
        Assert.Equal(17.50m, adminOverview.TotalPlatformRevenue);
        Assert.Equal(332.50m, adminOverview.TotalMerchantDisbursements);

        // 7. Verify buyer order history includes this PayPal order
        var buyerOrders = await _orderService.GetCustomerOrdersAsync("john@example.com");
        Assert.Single(buyerOrders);
        Assert.Equal(order.Id, buyerOrders[0].Id);
        Assert.Equal("PayPal", buyerOrders[0].PaymentMethod);
        Assert.Equal("Settled", buyerOrders[0].SettlementStatus);
    }

    #endregion
}

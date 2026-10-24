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

public class PromoAndGuestTrackTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly SocialCommerceDbContext _db;
    private readonly IPaymentProviderFactory _paymentFactory;
    private readonly OrderService _orderService;

    public PromoAndGuestTrackTests()
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

    public void Dispose()
    {
        _connection.Dispose();
        _db.Dispose();
    }

    [Fact]
    public void ValidatePromoCode_Welcome10_Applies10PercentDiscount()
    {
        var promoService = new PromoCodeService();
        var result = promoService.ValidatePromoCode("WELCOME10", 500m);

        Assert.True(result.IsValid);
        Assert.Equal(50m, result.DiscountAmount);
        Assert.Equal("WELCOME10", result.Code);
    }

    [Fact]
    public void ValidatePromoCode_Egypt2026_Applies15PercentDiscount()
    {
        var promoService = new PromoCodeService();
        var result = promoService.ValidatePromoCode("EGYPT2026", 600m);

        Assert.True(result.IsValid);
        Assert.Equal(90m, result.DiscountAmount);
    }

    [Fact]
    public void ValidatePromoCode_Save50_RequiresMinimumOrder()
    {
        var promoService = new PromoCodeService();
        var failure = promoService.ValidatePromoCode("SAVE50", 200m);
        Assert.False(failure.IsValid);

        var success = promoService.ValidatePromoCode("SAVE50", 450m);
        Assert.True(success.IsValid);
        Assert.Equal(50m, success.DiscountAmount);
    }

    [Fact]
    public void ValidatePromoCode_InvalidCode_ReturnsError()
    {
        var promoService = new PromoCodeService();
        var result = promoService.ValidatePromoCode("NONEXISTENT", 300m);

        Assert.False(result.IsValid);
        Assert.Equal(0m, result.DiscountAmount);
    }

    [Fact]
    public async Task TrackLookupAsync_FindsOrderByPaymentOrderIdAndPhone()
    {
        var merchant = new Merchant("Test Boutique", "test-boutique", "test@example.com");
        merchant.SetLocation(30.06, 31.22, "Zamalek", "Cairo");
        _db.Merchants.Add(merchant);

        var product = new Product(merchant.Id, "Boutique Item", 400m, "http://img.jpg", false, 10);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var order = new Order(
            merchant.Id,
            "Mohamed Ali",
            "mohamed@example.com",
            "10 Street, Dokki, Giza",
            new[] { new OrderItem(product.Id, product.Title, product.Price, 1) },
            0.05m,
            "CashOnDelivery",
            OrderStatus.Processing
        );
        order.AssignPaymentOrderId("COD-TEST1234");
        order.SetCustomerContact("01012345678", "Bldg 12, Apt 4");
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        // Positive lookup with exact order ID and phone
        var lookupReq = new OrderTrackLookupRequest("COD-TEST1234", "01012345678");
        var tracking = await _orderService.TrackLookupAsync(lookupReq);

        Assert.NotNull(tracking);
        Assert.Equal(order.Id, tracking.OrderId);
        Assert.Equal("Mohamed Ali", tracking.CustomerName);

        // Positive lookup with email
        var emailLookup = new OrderTrackLookupRequest("COD-TEST1234", "mohamed@example.com");
        var emailTracking = await _orderService.TrackLookupAsync(emailLookup);
        Assert.NotNull(emailTracking);

        // Negative lookup with mismatched phone
        var wrongLookup = new OrderTrackLookupRequest("COD-TEST1234", "01199999999");
        var wrongTracking = await _orderService.TrackLookupAsync(wrongLookup);
        Assert.Null(wrongTracking);
    }

    [Fact]
    public async Task CreateOrder_WithPromoCode_AppliesDiscountAndPreservesLedger()
    {
        var merchant = new Merchant("Discount Boutique", "disc-boutique", "disc@example.com");
        _db.Merchants.Add(merchant);

        var product = new Product(merchant.Id, "Luxury Kaftan", 1000m, "http://img.jpg", false, 10);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var request = new CreateOrderRequest(
            merchant.Id,
            "Sarah Ahmed",
            "sarah@example.com",
            "New Cairo, 5th Settlement",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "CashOnDelivery",
            CustomerPhone: "01022334455",
            BuildingDetails: "Villa 42",
            PromoCode: "WELCOME10"
        );

        var orderDto = await _orderService.CreateOrderAsync(request);

        // Subtotal: 1000, 10% capped at 100 EGP discount
        Assert.Equal("WELCOME10", orderDto.PromoCode);
        Assert.Equal(100m, orderDto.DiscountAmount);
        // TotalAmount: 900 (items) + 0 (shipping) = 900
        Assert.Equal(900m, orderDto.TotalAmount);
        // PlatformFee: 5% of 900 = 45m
        Assert.Equal(45m, orderDto.PlatformFeeAmount);
        // MerchantNet: 900 - 45 = 855m
        Assert.Equal(855m, orderDto.MerchantNetAmount);
        // Total = Fee + Net (45 + 855 = 900)
        Assert.Equal(orderDto.TotalAmount, orderDto.PlatformFeeAmount + orderDto.MerchantNetAmount);
    }

    [Fact]
    public void OtpVerification_FullLifecycle_SendAndVerify()
    {
        var otpService = new OtpVerificationService();
        var phone = "01099887766";

        // 1. Send OTP
        var sendResult = otpService.SendOtp(phone);
        Assert.True(sendResult.Success);
        Assert.NotNull(sendResult.DemoCode);
        Assert.Equal(4, sendResult.DemoCode.Length);

        // 2. Verify with wrong code
        var wrongResult = otpService.VerifyOtp(phone, "0000");
        Assert.False(wrongResult.Success);

        // 3. Verify with correct code
        var correctResult = otpService.VerifyOtp(phone, sendResult.DemoCode);
        Assert.True(correctResult.Success);

        // 4. Code is consumed, second verify fails
        var reusedResult = otpService.VerifyOtp(phone, sendResult.DemoCode);
        Assert.False(reusedResult.Success);
    }
}

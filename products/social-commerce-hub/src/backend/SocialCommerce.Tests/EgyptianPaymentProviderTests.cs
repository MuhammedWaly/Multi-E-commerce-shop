using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;
using SocialCommerce.Infrastructure.Payments;
using SocialCommerce.Infrastructure.Payments.Egyptian;
using SocialCommerce.Infrastructure.Payments.PayPal;
using Xunit;

namespace SocialCommerce.Tests;

public class EgyptianPaymentProviderTests
{
    private readonly CashOnDeliveryPaymentProvider _codProvider = new();
    private readonly FawryPaymentProvider _fawryProvider = new();
    private readonly InstaPayPaymentProvider _instaPayProvider = new();
    private readonly PayPalPaymentProvider _payPalProvider = new();

    private IPaymentProviderFactory CreateFactory()
    {
        return new PaymentProviderFactory(new IPaymentProvider[]
        {
            _payPalProvider,
            _codProvider,
            _fawryProvider,
            _instaPayProvider
        });
    }

    [Fact]
    public async Task CashOnDelivery_CreatePaymentOrder_Should_Return_Success_Without_ApprovalUrl()
    {
        var request = new PaymentOrderRequest(Guid.NewGuid(), 450m, "EGP", "http://return", "http://cancel", "COD Order");
        var result = await _codProvider.CreatePaymentOrderAsync(request);

        Assert.True(result.IsSuccess);
        Assert.StartsWith("COD-", result.PaymentOrderId);
        Assert.Empty(result.ApprovalUrl);
        Assert.Equal("CashOnDelivery", _codProvider.ProviderName);
        Assert.False(_codProvider.SupportsAutomatedPayouts);
    }

    [Fact]
    public async Task CashOnDelivery_CreatePaymentOrder_Should_Fail_When_Amount_Is_Zero_Or_Negative()
    {
        var request = new PaymentOrderRequest(Guid.NewGuid(), 0m, "EGP", "http://return", "http://cancel", "Invalid");
        var result = await _codProvider.CreatePaymentOrderAsync(request);

        Assert.False(result.IsSuccess);
        Assert.Contains("greater than zero", result.ErrorMessage);
    }

    [Fact]
    public async Task CashOnDelivery_VerifyPayment_Should_Return_Completed_Transaction()
    {
        var verifyReq = new PaymentVerificationRequest("COD-12345678", "COURIER-DELIVERY");
        var result = await _codProvider.VerifyPaymentAsync(verifyReq);

        Assert.True(result.IsSuccess);
        Assert.StartsWith("COD-TXN-", result.TransactionId);
        Assert.Equal("COMPLETED", result.Status);
    }

    [Fact]
    public async Task CashOnDelivery_VerifyPayment_Should_Fail_When_PaymentOrderId_Is_Missing()
    {
        var verifyReq = new PaymentVerificationRequest("", "COURIER-DELIVERY");
        var result = await _codProvider.VerifyPaymentAsync(verifyReq);

        Assert.False(result.IsSuccess);
        Assert.Equal("FAILED", result.Status);
    }

    [Fact]
    public async Task Fawry_CreatePaymentOrder_Should_Generate_8Digit_Reference_And_ApprovalUrl()
    {
        var request = new PaymentOrderRequest(Guid.NewGuid(), 850m, "EGP", "http://return", "http://cancel", "Fawry Order");
        var result = await _fawryProvider.CreatePaymentOrderAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal(8, result.PaymentOrderId.Length);
        Assert.True(int.TryParse(result.PaymentOrderId, out var code));
        Assert.InRange(code, 10000000, 99999999);
        Assert.Contains(result.PaymentOrderId, result.ApprovalUrl);
        Assert.Equal("Fawry", _fawryProvider.ProviderName);
        Assert.False(_fawryProvider.SupportsAutomatedPayouts);
    }

    [Fact]
    public async Task Fawry_CreatePaymentOrder_Should_Fail_When_Amount_Is_Zero_Or_Negative()
    {
        var request = new PaymentOrderRequest(Guid.NewGuid(), -50m, "EGP", "http://return", "http://cancel", "Negative");
        var result = await _fawryProvider.CreatePaymentOrderAsync(request);

        Assert.False(result.IsSuccess);
        Assert.Contains("greater than zero", result.ErrorMessage);
    }

    [Fact]
    public async Task Fawry_VerifyPayment_Should_Return_Completed_Transaction()
    {
        var verifyReq = new PaymentVerificationRequest("98234710", "FAWRY-KIOSK-SIMULATOR");
        var result = await _fawryProvider.VerifyPaymentAsync(verifyReq);

        Assert.True(result.IsSuccess);
        Assert.StartsWith("FAWRY-TXN-", result.TransactionId);
        Assert.Equal("COMPLETED", result.Status);
    }

    [Fact]
    public async Task Fawry_VerifyPayment_Should_Fail_When_Reference_Is_Missing()
    {
        var verifyReq = new PaymentVerificationRequest("", "FAWRY-KIOSK");
        var result = await _fawryProvider.VerifyPaymentAsync(verifyReq);

        Assert.False(result.IsSuccess);
        Assert.Equal("FAILED", result.Status);
    }

    [Fact]
    public async Task Fawry_ProcessWebhook_Should_Parse_Payload_Gracefully()
    {
        var payload = "{\"event_type\": \"FAWRY_PAYMENT_SUCCESS\", \"order_id\": \"98234710\"}";
        var headers = new Dictionary<string, string>();
        var result = await _fawryProvider.ProcessWebhookAsync(payload, headers);

        Assert.True(result.IsSuccess);
        Assert.Equal("FAWRY_PAYMENT_SUCCESS", result.EventType);
        Assert.Equal("98234710", result.OrderId);
    }

    [Fact]
    public async Task InstaPay_CreatePaymentOrder_Should_Generate_Insta_OrderId()
    {
        var request = new PaymentOrderRequest(Guid.NewGuid(), 1200m, "EGP", "http://return", "http://cancel", "InstaPay Order");
        var result = await _instaPayProvider.CreatePaymentOrderAsync(request);

        Assert.True(result.IsSuccess);
        Assert.StartsWith("INSTA-", result.PaymentOrderId);
        Assert.Empty(result.ApprovalUrl);
        Assert.Equal("InstaPay", _instaPayProvider.ProviderName);
        Assert.False(_instaPayProvider.SupportsAutomatedPayouts);
    }

    [Fact]
    public async Task InstaPay_CreatePaymentOrder_Should_Fail_When_Amount_Is_Zero_Or_Negative()
    {
        var request = new PaymentOrderRequest(Guid.NewGuid(), 0m, "EGP", "http://return", "http://cancel", "Invalid");
        var result = await _instaPayProvider.CreatePaymentOrderAsync(request);

        Assert.False(result.IsSuccess);
        Assert.Contains("greater than zero", result.ErrorMessage);
    }

    [Fact]
    public async Task InstaPay_VerifyPayment_Should_Return_Completed_Transaction()
    {
        var verifyReq = new PaymentVerificationRequest("INSTA-88492011", "+201001234567");
        var result = await _instaPayProvider.VerifyPaymentAsync(verifyReq);

        Assert.True(result.IsSuccess);
        Assert.StartsWith("INSTA-TXN-", result.TransactionId);
        Assert.Equal("COMPLETED", result.Status);
    }

    [Fact]
    public async Task InstaPay_VerifyPayment_Should_Fail_When_Reference_And_PayerId_Missing()
    {
        var verifyReq = new PaymentVerificationRequest("", "");
        var result = await _instaPayProvider.VerifyPaymentAsync(verifyReq);

        Assert.False(result.IsSuccess);
        Assert.Equal("FAILED", result.Status);
    }

    [Theory]
    [InlineData("CashOnDelivery", "CashOnDelivery")]
    [InlineData("COD", "CashOnDelivery")]
    [InlineData("cash", "CashOnDelivery")]
    [InlineData("Fawry", "Fawry")]
    [InlineData("FawryPay", "Fawry")]
    [InlineData("InstaPay", "InstaPay")]
    [InlineData("MobileWallet", "InstaPay")]
    [InlineData("VodafoneCash", "InstaPay")]
    [InlineData("OrangeMoney", "InstaPay")]
    [InlineData("EtisalatCash", "InstaPay")]
    [InlineData("WEPay", "InstaPay")]
    [InlineData("PayPal", "PayPal")]
    [InlineData("", "PayPal")]
    [InlineData(null, "PayPal")]
    public void PaymentProviderFactory_Should_Resolve_All_Egyptian_Gateways_And_Aliases(string? inputName, string expectedProvider)
    {
        var factory = CreateFactory();
        var provider = factory.GetProvider(inputName!);

        Assert.NotNull(provider);
        Assert.Equal(expectedProvider, provider.ProviderName);
    }

    [Fact]
    public void PaymentProviderFactory_Should_Throw_For_Unsupported_Provider()
    {
        var factory = CreateFactory();
        Assert.Throws<NotSupportedException>(() => factory.GetProvider("BitcoinCrypto"));
    }
}

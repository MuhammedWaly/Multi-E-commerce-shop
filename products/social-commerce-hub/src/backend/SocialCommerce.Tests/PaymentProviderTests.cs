using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;
using SocialCommerce.Infrastructure.Payments;
using SocialCommerce.Infrastructure.Payments.PayPal;
using Xunit;

namespace SocialCommerce.Tests;

public class PaymentProviderTests
{
    [Fact]
    public async Task PayPal_CreatePaymentOrder_Should_Return_ApprovalUrl_When_Amount_Valid()
    {
        var provider = new PayPalPaymentProvider();
        var request = new PaymentOrderRequest(Guid.NewGuid(), 150.50m, "USD", "https://return", "https://cancel", "Test Order");

        var result = await provider.CreatePaymentOrderAsync(request);

        Assert.True(result.IsSuccess);
        Assert.StartsWith("PAYPAL-ORDER-", result.PaymentOrderId);
        Assert.Contains("sandbox.paypal.com", result.ApprovalUrl);
    }

    [Fact]
    public async Task PayPal_CreatePaymentOrder_Should_Fail_When_Amount_Is_Zero_Or_Negative()
    {
        var provider = new PayPalPaymentProvider();
        var request = new PaymentOrderRequest(Guid.NewGuid(), -10m, "USD", "https://return", "https://cancel", "Invalid");

        var result = await provider.CreatePaymentOrderAsync(request);

        Assert.False(result.IsSuccess);
        Assert.Equal("Payment amount must be greater than zero.", result.ErrorMessage);
    }

    [Fact]
    public void PaymentProviderFactory_Should_Resolve_PayPal_As_Default()
    {
        var payPalProvider = new PayPalPaymentProvider();
        var factory = new PaymentProviderFactory(new IPaymentProvider[] { payPalProvider });

        var defaultProvider = factory.GetDefaultProvider();

        Assert.NotNull(defaultProvider);
        Assert.Equal("PayPal", defaultProvider.ProviderName);
        Assert.False(defaultProvider.SupportsAutomatedPayouts);
    }
}

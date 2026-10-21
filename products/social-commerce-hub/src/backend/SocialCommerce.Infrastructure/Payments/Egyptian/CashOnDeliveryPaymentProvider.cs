using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;

namespace SocialCommerce.Infrastructure.Payments.Egyptian;

public class CashOnDeliveryPaymentProvider : IPaymentProvider
{
    public string ProviderName => "CashOnDelivery";
    public bool SupportsAutomatedPayouts => false;

    public Task<PaymentOrderResult> CreatePaymentOrderAsync(PaymentOrderRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
        {
            return Task.FromResult(new PaymentOrderResult(false, string.Empty, string.Empty, "Order amount must be greater than zero for Cash on Delivery."));
        }

        var codOrderId = $"COD-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        // Cash on delivery requires no upfront digital redirect URL
        return Task.FromResult(new PaymentOrderResult(true, codOrderId, string.Empty));
    }

    public Task<PaymentVerificationResult> VerifyPaymentAsync(PaymentVerificationRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.PaymentOrderId))
        {
            return Task.FromResult(new PaymentVerificationResult(false, string.Empty, "FAILED", "Missing PaymentOrderId."));
        }

        var transactionId = $"COD-TXN-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        return Task.FromResult(new PaymentVerificationResult(true, transactionId, "COMPLETED"));
    }

    public Task<WebhookProcessResult> ProcessWebhookAsync(string payload, IDictionary<string, string> headers, CancellationToken ct = default)
    {
        return Task.FromResult(new WebhookProcessResult(true, "COD_DELIVERY_CONFIRMED"));
    }
}

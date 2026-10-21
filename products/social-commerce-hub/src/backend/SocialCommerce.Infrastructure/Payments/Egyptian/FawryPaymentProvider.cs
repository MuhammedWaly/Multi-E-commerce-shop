using System.Text.Json;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;

namespace SocialCommerce.Infrastructure.Payments.Egyptian;

public class FawryPaymentProvider : IPaymentProvider
{
    public string ProviderName => "Fawry";
    public bool SupportsAutomatedPayouts => false;

    public Task<PaymentOrderResult> CreatePaymentOrderAsync(PaymentOrderRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
        {
            return Task.FromResult(new PaymentOrderResult(false, string.Empty, string.Empty, "Payment amount must be greater than zero."));
        }

        // Generates realistic simulated 8-digit Fawry bill reference number (e.g., 98234710)
        var billRefCode = Random.Shared.Next(10000000, 100000000).ToString();
        var approvalUrl = $"https://www.fawry.com/pay/{billRefCode}";

        return Task.FromResult(new PaymentOrderResult(true, billRefCode, approvalUrl));
    }

    public Task<PaymentVerificationResult> VerifyPaymentAsync(PaymentVerificationRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.PaymentOrderId))
        {
            return Task.FromResult(new PaymentVerificationResult(false, string.Empty, "FAILED", "Missing Fawry bill reference number."));
        }

        var transactionId = $"FAWRY-TXN-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        return Task.FromResult(new PaymentVerificationResult(true, transactionId, "COMPLETED"));
    }

    public Task<WebhookProcessResult> ProcessWebhookAsync(string payload, IDictionary<string, string> headers, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            return Task.FromResult(new WebhookProcessResult(false, "UNKNOWN", null, "Empty webhook payload."));
        }

        try
        {
            using var doc = JsonDocument.Parse(payload);
            var eventType = doc.RootElement.TryGetProperty("event_type", out var typeProp)
                ? typeProp.GetString() ?? "FAWRY_PAYMENT_SUCCESS"
                : "FAWRY_PAYMENT_SUCCESS";

            var orderId = doc.RootElement.TryGetProperty("order_id", out var orderProp)
                ? orderProp.GetString()
                : null;

            return Task.FromResult(new WebhookProcessResult(true, eventType, orderId));
        }
        catch (JsonException ex)
        {
            return Task.FromResult(new WebhookProcessResult(false, "INVALID_JSON", null, ex.Message));
        }
    }
}

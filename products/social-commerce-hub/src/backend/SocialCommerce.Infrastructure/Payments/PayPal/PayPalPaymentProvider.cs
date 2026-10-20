using System.Text.Json;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;

namespace SocialCommerce.Infrastructure.Payments.PayPal;

public class PayPalPaymentProvider : IPaymentProvider
{
    public string ProviderName => "PayPal";
    public bool SupportsAutomatedPayouts => false;

    public Task<PaymentOrderResult> CreatePaymentOrderAsync(PaymentOrderRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
        {
            return Task.FromResult(new PaymentOrderResult(false, string.Empty, string.Empty, "Payment amount must be greater than zero."));
        }

        // Generates PayPal Sandbox order structure
        var mockOrderId = $"PAYPAL-ORDER-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        var mockApprovalUrl = $"https://www.sandbox.paypal.com/checkoutnow?token={mockOrderId}";

        return Task.FromResult(new PaymentOrderResult(true, mockOrderId, mockApprovalUrl));
    }

    public Task<PaymentVerificationResult> VerifyPaymentAsync(PaymentVerificationRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.PaymentOrderId) || string.IsNullOrWhiteSpace(request.PayerId))
        {
            return Task.FromResult(new PaymentVerificationResult(false, string.Empty, "FAILED", "Missing PaymentOrderId or PayerId."));
        }

        var mockCaptureId = $"CAPTURE-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        return Task.FromResult(new PaymentVerificationResult(true, mockCaptureId, "COMPLETED"));
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
                ? typeProp.GetString() ?? "UNKNOWN" 
                : "UNKNOWN";

            return Task.FromResult(new WebhookProcessResult(true, eventType));
        }
        catch (JsonException ex)
        {
            return Task.FromResult(new WebhookProcessResult(false, "INVALID_JSON", null, ex.Message));
        }
    }
}

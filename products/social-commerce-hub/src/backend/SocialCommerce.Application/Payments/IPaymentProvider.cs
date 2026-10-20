using SocialCommerce.Application.Payments.Models;

namespace SocialCommerce.Application.Payments;

public interface IPaymentProvider
{
    string ProviderName { get; }

    Task<PaymentOrderResult> CreatePaymentOrderAsync(PaymentOrderRequest request, CancellationToken ct = default);

    Task<PaymentVerificationResult> VerifyPaymentAsync(PaymentVerificationRequest request, CancellationToken ct = default);

    Task<WebhookProcessResult> ProcessWebhookAsync(string payload, IDictionary<string, string> headers, CancellationToken ct = default);

    bool SupportsAutomatedPayouts { get; }
}

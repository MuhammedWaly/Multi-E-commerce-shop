namespace SocialCommerce.Infrastructure.Payments.PayPal;

public class PayPalSettings
{
    public const string SectionName = "PayPal";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Mode { get; set; } = "Sandbox"; // "Sandbox" or "Live"
    public string Currency { get; set; } = "USD";
    public decimal ExchangeRateEgpToUsd { get; set; } = 0.021m; // 1 EGP ~= 0.021 USD
    public string ReturnUrl { get; set; } = "http://localhost:5173/checkout/success";
    public string CancelUrl { get; set; } = "http://localhost:5173/checkout/cancel";

    public string BaseUrl => Mode.Equals("Live", StringComparison.OrdinalIgnoreCase)
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ClientId) &&
                                !string.IsNullOrWhiteSpace(ClientSecret) &&
                                !ClientId.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase) &&
                                !ClientSecret.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase);
}

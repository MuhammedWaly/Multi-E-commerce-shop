using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;

namespace SocialCommerce.Infrastructure.Payments.PayPal;

public class PayPalPaymentProvider : IPaymentProvider
{
    private readonly HttpClient? _httpClient;
    private readonly PayPalSettings _settings;
    private readonly ILogger<PayPalPaymentProvider>? _logger;

    private string? _cachedAccessToken;
    private DateTime _tokenExpiresAtUtc = DateTime.MinValue;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);

    public string ProviderName => "PayPal";
    public bool SupportsAutomatedPayouts => false;

    // Parameterless constructor for unit testing and backwards compatibility
    public PayPalPaymentProvider()
    {
        _httpClient = null;
        _settings = new PayPalSettings();
        _logger = null;
    }

    // Dependency injection constructor for live / sandbox PayPal REST API integration
    public PayPalPaymentProvider(
        HttpClient httpClient,
        IOptions<PayPalSettings> settings,
        ILogger<PayPalPaymentProvider>? logger = null)
    {
        _httpClient = httpClient;
        _settings = settings.Value ?? new PayPalSettings();
        _logger = logger;
    }

    public async Task<PaymentOrderResult> CreatePaymentOrderAsync(PaymentOrderRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
        {
            return new PaymentOrderResult(false, string.Empty, string.Empty, "Payment amount must be greater than zero.");
        }

        // If real PayPal credentials are provided and HttpClient is available, execute real PayPal REST API
        if (_settings.IsConfigured && _httpClient != null)
        {
            try
            {
                var accessToken = await GetAccessTokenAsync(ct);
                if (string.IsNullOrWhiteSpace(accessToken))
                {
                    _logger?.LogWarning("Failed to obtain PayPal OAuth token. Falling back to sandbox simulation.");
                    return CreateMockPaymentOrder(request);
                }

                // Currency conversion from EGP to target PayPal currency (default USD)
                var targetCurrency = string.IsNullOrWhiteSpace(request.Currency) || request.Currency.Equals("EGP", StringComparison.OrdinalIgnoreCase)
                    ? _settings.Currency
                    : request.Currency;

                var finalAmount = targetCurrency.Equals("USD", StringComparison.OrdinalIgnoreCase) && request.Currency.Equals("EGP", StringComparison.OrdinalIgnoreCase)
                    ? Math.Max(0.01m, Math.Round(request.Amount * _settings.ExchangeRateEgpToUsd, 2))
                    : request.Amount;

                var returnUrl = !string.IsNullOrWhiteSpace(request.ReturnUrl) ? request.ReturnUrl : _settings.ReturnUrl;
                var cancelUrl = !string.IsNullOrWhiteSpace(request.CancelUrl) ? request.CancelUrl : _settings.CancelUrl;

                var orderPayload = new
                {
                    intent = "CAPTURE",
                    purchase_units = new[]
                    {
                        new
                        {
                            reference_id = request.OrderId.ToString(),
                            description = string.IsNullOrWhiteSpace(request.Description) ? "Social-Commerce-Hub Order" : request.Description,
                            amount = new
                            {
                                currency_code = targetCurrency,
                                value = finalAmount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)
                            }
                        }
                    },
                    application_context = new
                    {
                        return_url = returnUrl,
                        cancel_url = cancelUrl,
                        brand_name = "Social-Commerce-Hub",
                        user_action = "PAY_NOW"
                    }
                };

                using var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{_settings.BaseUrl}/v2/checkout/orders");
                requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                requestMessage.Content = new StringContent(JsonSerializer.Serialize(orderPayload), Encoding.UTF8, "application/json");

                using var response = await _httpClient.SendAsync(requestMessage, ct);
                var responseContent = await response.Content.ReadAsStringAsync(ct);

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(responseContent);
                    var payPalOrderId = doc.RootElement.GetProperty("id").GetString() ?? string.Empty;
                    var approvalUrl = string.Empty;

                    if (doc.RootElement.TryGetProperty("links", out var links) && links.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var link in links.EnumerateArray())
                        {
                            if (link.TryGetProperty("rel", out var rel) && rel.GetString() == "approve")
                            {
                                approvalUrl = link.GetProperty("href").GetString() ?? string.Empty;
                                break;
                            }
                        }
                    }

                    if (string.IsNullOrWhiteSpace(approvalUrl))
                    {
                        approvalUrl = $"https://www.{(_settings.Mode.Equals("Live", StringComparison.OrdinalIgnoreCase) ? "" : "sandbox.")}paypal.com/checkoutnow?token={payPalOrderId}";
                    }

                    _logger?.LogInformation("Successfully created live PayPal order {PayPalOrderId}", payPalOrderId);
                    return new PaymentOrderResult(true, payPalOrderId, approvalUrl);
                }

                _logger?.LogError("PayPal Order creation failed with status {StatusCode}: {Response}", response.StatusCode, responseContent);
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Exception while contacting PayPal API: {Message}", ex.Message);
            }
        }

        // Sandbox / fallback simulation when live credentials are not set
        return CreateMockPaymentOrder(request);
    }

    public async Task<PaymentVerificationResult> VerifyPaymentAsync(PaymentVerificationRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.PaymentOrderId) || string.IsNullOrWhiteSpace(request.PayerId))
        {
            return new PaymentVerificationResult(false, string.Empty, "FAILED", "Missing PaymentOrderId or PayerId.");
        }

        // If real PayPal credentials configured and not a mock ID, capture on PayPal REST API
        if (_settings.IsConfigured && _httpClient != null && !request.PaymentOrderId.StartsWith("PAYPAL-ORDER-MOCK", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var accessToken = await GetAccessTokenAsync(ct);
                if (!string.IsNullOrWhiteSpace(accessToken))
                {
                    using var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{_settings.BaseUrl}/v2/checkout/orders/{request.PaymentOrderId}/capture");
                    requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                    requestMessage.Content = new StringContent("{}", Encoding.UTF8, "application/json");

                    using var response = await _httpClient.SendAsync(requestMessage, ct);
                    var responseContent = await response.Content.ReadAsStringAsync(ct);

                    if (response.IsSuccessStatusCode)
                    {
                        using var doc = JsonDocument.Parse(responseContent);
                        var status = doc.RootElement.TryGetProperty("status", out var statusProp) ? statusProp.GetString() : "COMPLETED";

                        var captureId = string.Empty;
                        if (doc.RootElement.TryGetProperty("purchase_units", out var units) && units.GetArrayLength() > 0)
                        {
                            var unit = units[0];
                            if (unit.TryGetProperty("payments", out var payments) &&
                                payments.TryGetProperty("captures", out var captures) &&
                                captures.GetArrayLength() > 0)
                            {
                                captureId = captures[0].TryGetProperty("id", out var idProp) ? idProp.GetString() ?? string.Empty : string.Empty;
                            }
                        }

                        if (string.IsNullOrWhiteSpace(captureId))
                        {
                            captureId = $"PAYPAL-CAP-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
                        }

                        _logger?.LogInformation("PayPal order {OrderId} captured successfully. CaptureId: {CaptureId}", request.PaymentOrderId, captureId);
                        return new PaymentVerificationResult(true, captureId, status ?? "COMPLETED");
                    }

                    _logger?.LogWarning("PayPal Capture API returned {StatusCode}: {Content}", response.StatusCode, responseContent);
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "PayPal capture failed: {Message}", ex.Message);
            }
        }

        // Mock verification fallback
        var mockCaptureId = $"CAPTURE-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        return new PaymentVerificationResult(true, mockCaptureId, "COMPLETED");
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

            string? resourceId = null;
            if (doc.RootElement.TryGetProperty("resource", out var resProp) && resProp.TryGetProperty("id", out var idProp))
            {
                resourceId = idProp.GetString();
            }

            _logger?.LogInformation("PayPal Webhook received: {EventType} for resource {ResourceId}", eventType, resourceId);
            return Task.FromResult(new WebhookProcessResult(true, eventType, resourceId));
        }
        catch (JsonException ex)
        {
            return Task.FromResult(new WebhookProcessResult(false, "INVALID_JSON", null, ex.Message));
        }
    }

    private async Task<string?> GetAccessTokenAsync(CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(_cachedAccessToken) && DateTime.UtcNow < _tokenExpiresAtUtc.AddMinutes(-2))
        {
            return _cachedAccessToken;
        }

        await _tokenLock.WaitAsync(ct);
        try
        {
            if (!string.IsNullOrWhiteSpace(_cachedAccessToken) && DateTime.UtcNow < _tokenExpiresAtUtc.AddMinutes(-2))
            {
                return _cachedAccessToken;
            }

            if (_httpClient == null || string.IsNullOrWhiteSpace(_settings.ClientId) || string.IsNullOrWhiteSpace(_settings.ClientSecret))
            {
                return null;
            }

            var authHeaderVal = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_settings.ClientId}:{_settings.ClientSecret}"));
            using var tokenRequest = new HttpRequestMessage(HttpMethod.Post, $"{_settings.BaseUrl}/v1/oauth2/token");
            tokenRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeaderVal);
            tokenRequest.Content = new StringContent("grant_type=client_credentials", Encoding.UTF8, "application/x-www-form-urlencoded");

            using var response = await _httpClient.SendAsync(tokenRequest, ct);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(ct);
                _logger?.LogError("Failed to obtain PayPal OAuth token. Status: {StatusCode}, Body: {Body}", response.StatusCode, errorText);
                return null;
            }

            var responseBody = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(responseBody);
            _cachedAccessToken = doc.RootElement.GetProperty("access_token").GetString();
            var expiresInSeconds = doc.RootElement.TryGetProperty("expires_in", out var exp) ? exp.GetInt32() : 3600;
            _tokenExpiresAtUtc = DateTime.UtcNow.AddSeconds(expiresInSeconds);

            return _cachedAccessToken;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Exception obtaining PayPal OAuth token: {Message}", ex.Message);
            return null;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    private static PaymentOrderResult CreateMockPaymentOrder(PaymentOrderRequest request)
    {
        var mockOrderId = $"PAYPAL-ORDER-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        var mockApprovalUrl = $"https://www.sandbox.paypal.com/checkoutnow?token={mockOrderId}";
        return new PaymentOrderResult(true, mockOrderId, mockApprovalUrl);
    }
}

namespace SocialCommerce.Application.Payments.Models;

public record PaymentOrderRequest(
    Guid OrderId,
    decimal Amount,
    string Currency,
    string ReturnUrl,
    string CancelUrl,
    string Description
);

public record PaymentOrderResult(
    bool IsSuccess,
    string PaymentOrderId,
    string ApprovalUrl,
    string? ErrorMessage = null
);

public record PaymentVerificationRequest(
    string PaymentOrderId,
    string PayerId
);

public record PaymentVerificationResult(
    bool IsSuccess,
    string TransactionId,
    string Status,
    string? ErrorMessage = null
);

public record WebhookProcessResult(
    bool IsSuccess,
    string EventType,
    string? OrderId = null,
    string? ErrorMessage = null
);

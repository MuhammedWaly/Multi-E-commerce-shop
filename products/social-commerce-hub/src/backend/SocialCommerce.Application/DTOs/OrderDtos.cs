namespace SocialCommerce.Application.DTOs;

public record CreateOrderItemRequest(
    Guid ProductId,
    int Quantity
);

public record CreateOrderRequest(
    Guid MerchantId,
    string CustomerName,
    string CustomerEmail,
    string ShippingAddress,
    List<CreateOrderItemRequest> Items
);

public record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductTitle,
    decimal UnitPrice,
    int Quantity,
    decimal Subtotal
);

public record OrderDto(
    Guid Id,
    Guid MerchantId,
    string CustomerName,
    string CustomerEmail,
    string ShippingAddress,
    string Status,
    decimal TotalAmount,
    decimal PlatformFeeAmount,
    decimal MerchantNetAmount,
    string? PaymentOrderId,
    string? PaymentTransactionId,
    DateTime CreatedAtUtc,
    DateTime? PaidAtUtc,
    IReadOnlyList<OrderItemDto> Items
);

public record CaptureOrderRequest(
    string PaymentOrderId,
    string PayerId
);

public record CaptureOrderResult(
    bool IsSuccess,
    string TransactionId,
    string Status,
    OrderDto? Order = null,
    string? ErrorMessage = null
);

public record MerchantLedgerEntryDto(
    Guid Id,
    Guid MerchantId,
    Guid? OrderId,
    string Type,
    decimal Amount,
    string Description,
    DateTime CreatedAtUtc
);

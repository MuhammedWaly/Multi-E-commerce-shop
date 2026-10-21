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
    List<CreateOrderItemRequest> Items,
    string? PaymentMethod = "PayPal",
    string? SenderWallet = null,
    string? PaymentReference = null,
    string? SenderWalletOrReference = null
)
{
    public string? EffectiveSenderWallet => !string.IsNullOrWhiteSpace(SenderWalletOrReference)
        ? SenderWalletOrReference
        : SenderWallet;
}

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
    IReadOnlyList<OrderItemDto> Items,
    string PaymentMethod = "PayPal",
    string? PaymentReference = null,
    string? PaymentInstructions = null,
    DateTime? PaymentExpiresAtUtc = null,
    string? SenderWalletOrReference = null,
    string? SettlementStatus = null
);

public record CaptureOrderRequest(
    string PaymentOrderId,
    string PayerId,
    string? TransactionReference = null
);

public record SettleFawryOrderRequest(
    string? ReferenceNumber = null,
    string? KioskTerminalId = null
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

public record MerchantDashboardDto(
    Guid MerchantId,
    string StoreName,
    decimal Balance,
    int TotalOrdersCount,
    decimal TotalGrossSales,
    decimal TotalNetEarnings,
    decimal TotalPlatformFees,
    int TotalProductsCount,
    IReadOnlyList<OrderDto> RecentOrders
);

public record UpdateOrderStatusRequest(
    string Status
);

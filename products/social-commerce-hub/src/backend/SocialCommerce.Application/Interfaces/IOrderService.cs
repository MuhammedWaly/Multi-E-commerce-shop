using SocialCommerce.Application.DTOs;

namespace SocialCommerce.Application.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, CancellationToken ct = default);
    Task<OrderDto?> GetOrderByIdAsync(Guid id, CancellationToken ct = default);
    Task<CaptureOrderResult> CaptureOrderAsync(Guid orderId, CaptureOrderRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<MerchantLedgerEntryDto>> GetMerchantLedgerAsync(Guid merchantId, CancellationToken ct = default);
    Task<MerchantDashboardDto?> GetMerchantDashboardAsync(Guid merchantId, CancellationToken ct = default);
    Task<IReadOnlyList<OrderDto>> GetMerchantOrdersAsync(Guid merchantId, CancellationToken ct = default);
    Task<OrderDto> UpdateOrderStatusAsync(Guid orderId, string newStatus, CancellationToken ct = default);
}

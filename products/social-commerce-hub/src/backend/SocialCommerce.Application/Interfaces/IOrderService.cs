using SocialCommerce.Application.DTOs;

namespace SocialCommerce.Application.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, CancellationToken ct = default);
    Task<OrderDto?> GetOrderByIdAsync(Guid id, CancellationToken ct = default);
    Task<CaptureOrderResult> CaptureOrderAsync(Guid orderId, CaptureOrderRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<MerchantLedgerEntryDto>> GetMerchantLedgerAsync(Guid merchantId, CancellationToken ct = default);
}

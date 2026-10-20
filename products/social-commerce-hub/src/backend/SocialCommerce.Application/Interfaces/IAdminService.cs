using SocialCommerce.Application.DTOs;

namespace SocialCommerce.Application.Interfaces;

public interface IAdminService
{
    Task<PlatformOverviewDto> GetOverviewAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminMerchantDto>> GetAllMerchantsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminUserDto>> GetAllUsersAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminOrderDto>> GetAllOrdersAsync(CancellationToken ct = default);
    Task<bool> UpdateMerchantStatusAsync(Guid merchantId, bool isActive, CancellationToken ct = default);
    Task<bool> DeleteMerchantAsync(Guid merchantId, CancellationToken ct = default);
    Task<bool> DeleteProductAsync(Guid productId, CancellationToken ct = default);
}

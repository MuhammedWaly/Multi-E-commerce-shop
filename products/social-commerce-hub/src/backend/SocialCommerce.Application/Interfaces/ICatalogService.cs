using SocialCommerce.Application.DTOs;

namespace SocialCommerce.Application.Interfaces;

public interface ICatalogService
{
    Task<IReadOnlyList<FeedItemDto>> GetFeedAsync(int page = 1, int pageSize = 20, CancellationToken ct = default);
    Task<MerchantDto> CreateMerchantAsync(CreateMerchantRequest request, CancellationToken ct = default);
    Task<MerchantDetailsDto?> GetMerchantBySlugAsync(string slug, CancellationToken ct = default);
    Task<ProductDto> AddProductAsync(Guid merchantId, AddProductRequest request, CancellationToken ct = default);
}

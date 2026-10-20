using SocialCommerce.Application.DTOs;

namespace SocialCommerce.Application.Interfaces;

public interface IReviewService
{
    Task<ReviewDto> AddReviewAsync(Guid productId, CreateReviewRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ReviewDto>> GetProductReviewsAsync(Guid productId, CancellationToken ct = default);
}

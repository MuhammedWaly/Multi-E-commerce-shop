using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Api.Controllers;

[Route("api/[controller]")]
public class ProductsController : BaseApiController
{
    private readonly IReviewService _reviewService;

    public ProductsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    /// <summary>
    /// Retrieves verified reviews and ratings for a product
    /// </summary>
    [HttpGet("{id:guid}/reviews")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ReviewDto>>>> GetProductReviews(
        Guid id,
        CancellationToken ct = default)
    {
        var reviews = await _reviewService.GetProductReviewsAsync(id, ct);
        return Success(reviews, "Product reviews retrieved successfully.");
    }

    /// <summary>
    /// Submits a verified purchaser review for a product
    /// </summary>
    [HttpPost("{id:guid}/reviews")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<ReviewDto>>> AddProductReview(
        Guid id,
        [FromBody] CreateReviewRequest request,
        CancellationToken ct = default)
    {
        var review = await _reviewService.AddReviewAsync(id, request, ct);
        return CreatedSuccess($"/api/products/{id}/reviews", review, "Verified purchaser review submitted successfully.");
    }
}

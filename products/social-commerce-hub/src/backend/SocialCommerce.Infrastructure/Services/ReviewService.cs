using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;

namespace SocialCommerce.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly SocialCommerceDbContext _db;

    public ReviewService(SocialCommerceDbContext db)
    {
        _db = db;
    }

    public async Task<ReviewDto> AddReviewAsync(Guid productId, CreateReviewRequest request, CancellationToken ct = default)
    {
        var product = await _db.Products.FindAsync(new object[] { productId }, ct);
        if (product == null)
            throw new ArgumentException("Product not found.", nameof(productId));

        // 1. Verify that the order exists and is paid/fulfilled
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct);

        if (order == null)
            throw new InvalidOperationException("Order not found. Reviews can only be submitted for valid purchases.");

        if (order.Status != OrderStatus.Paid && order.Status != OrderStatus.Fulfilled)
            throw new InvalidOperationException("Reviews can only be submitted for completed and paid orders.");

        // 2. Verify that this order actually contains the reviewed product
        var hasPurchasedProduct = order.Items.Any(i => i.ProductId == productId);
        if (!hasPurchasedProduct)
            throw new InvalidOperationException("The specified order does not contain this product.");

        // 3. Verify customer identity (email matches order email)
        if (!string.Equals(order.CustomerEmail, request.CustomerEmail.Trim(), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("The customer email does not match the purchasing order account.");

        // 4. Ensure no duplicate review for the same order and product
        var existingReview = await _db.Reviews.AnyAsync(r => r.OrderId == request.OrderId && r.ProductId == productId, ct);
        if (existingReview)
            throw new InvalidOperationException("A review has already been submitted for this order item.");

        // 5. Create Review entity (Verified Purchaser)
        var review = new Review(
            productId,
            request.OrderId,
            request.CustomerName,
            request.CustomerEmail,
            request.Rating,
            request.Comment,
            isVerifiedPurchase: true
        );

        // 6. Update Product aggregate rating statistics
        product.AddReviewRating(request.Rating);

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync(ct);

        return new ReviewDto(
            review.Id,
            review.ProductId,
            review.OrderId,
            review.CustomerName,
            review.Rating,
            review.Comment,
            review.IsVerifiedPurchase,
            review.CreatedAtUtc
        );
    }

    public async Task<IReadOnlyList<ReviewDto>> GetProductReviewsAsync(Guid productId, CancellationToken ct = default)
    {
        return await _db.Reviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new ReviewDto(
                r.Id,
                r.ProductId,
                r.OrderId,
                r.CustomerName,
                r.Rating,
                r.Comment,
                r.IsVerifiedPurchase,
                r.CreatedAtUtc
            ))
            .ToListAsync(ct);
    }
}

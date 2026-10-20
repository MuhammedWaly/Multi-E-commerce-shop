namespace SocialCommerce.Application.DTOs;

public record CreateReviewRequest(
    Guid OrderId,
    string CustomerName,
    string CustomerEmail,
    int Rating,
    string Comment
);

public record ReviewDto(
    Guid Id,
    Guid ProductId,
    Guid OrderId,
    string CustomerName,
    int Rating,
    string Comment,
    bool IsVerifiedPurchase,
    DateTime CreatedAtUtc
);

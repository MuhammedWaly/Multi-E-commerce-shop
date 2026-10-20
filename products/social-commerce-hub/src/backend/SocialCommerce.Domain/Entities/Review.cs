namespace SocialCommerce.Domain.Entities;

public class Review
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid OrderId { get; private set; }
    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerEmail { get; private set; } = string.Empty;
    public int Rating { get; private set; }
    public string Comment { get; private set; } = string.Empty;
    public bool IsVerifiedPurchase { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    // Parameterless constructor required by EF Core
    private Review() { }

    public Review(Guid productId, Guid orderId, string customerName, string customerEmail, int rating, string comment, bool isVerifiedPurchase = true)
    {
        if (productId == Guid.Empty)
            throw new ArgumentException("Product ID cannot be empty.", nameof(productId));

        if (orderId == Guid.Empty)
            throw new ArgumentException("Order ID cannot be empty.", nameof(orderId));

        if (string.IsNullOrWhiteSpace(customerName))
            throw new ArgumentException("Customer name cannot be empty.", nameof(customerName));

        if (string.IsNullOrWhiteSpace(customerEmail))
            throw new ArgumentException("Customer email cannot be empty.", nameof(customerEmail));

        if (rating < 1 || rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5 stars.", nameof(rating));

        if (string.IsNullOrWhiteSpace(comment))
            throw new ArgumentException("Review comment cannot be empty.", nameof(comment));

        Id = Guid.NewGuid();
        ProductId = productId;
        OrderId = orderId;
        CustomerName = customerName.Trim();
        CustomerEmail = customerEmail.Trim().ToLowerInvariant();
        Rating = rating;
        Comment = comment.Trim();
        IsVerifiedPurchase = isVerifiedPurchase;
        CreatedAtUtc = DateTime.UtcNow;
    }
}

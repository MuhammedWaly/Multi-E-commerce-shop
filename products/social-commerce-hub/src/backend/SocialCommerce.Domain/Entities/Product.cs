namespace SocialCommerce.Domain.Entities;

public class Product
{
    public Guid Id { get; private set; }
    public Guid MerchantId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public string MediaUrl { get; private set; } = string.Empty;
    public bool IsVideo { get; private set; }
    public int StockQuantity { get; private set; }
    public double RatingAverage { get; private set; }
    public int ReviewCount { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    // Parameterless constructor required by EF Core
    private Product() { }

    public Product(Guid merchantId, string title, decimal price, string mediaUrl, bool isVideo, int initialStock)
    {
        if (merchantId == Guid.Empty)
            throw new ArgumentException("Merchant ID cannot be empty.", nameof(merchantId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Product title cannot be empty.", nameof(title));

        if (price < 0)
            throw new ArgumentException("Product price cannot be negative.", nameof(price));

        if (string.IsNullOrWhiteSpace(mediaUrl))
            throw new ArgumentException("Media URL cannot be empty.", nameof(mediaUrl));

        if (initialStock < 0)
            throw new ArgumentException("Initial stock quantity cannot be negative.", nameof(initialStock));

        Id = Guid.NewGuid();
        MerchantId = merchantId;
        Title = title.Trim();
        Price = price;
        MediaUrl = mediaUrl.Trim();
        IsVideo = isVideo;
        StockQuantity = initialStock;
        RatingAverage = 5.0; // Initial default
        ReviewCount = 0;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void UpdateDetails(string title, decimal price, string mediaUrl, bool isVideo, int stockQuantity)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Product title cannot be empty.", nameof(title));

        if (price < 0)
            throw new ArgumentException("Product price cannot be negative.", nameof(price));

        if (string.IsNullOrWhiteSpace(mediaUrl))
            throw new ArgumentException("Media URL cannot be empty.", nameof(mediaUrl));

        if (stockQuantity < 0)
            throw new ArgumentException("Stock quantity cannot be negative.", nameof(stockQuantity));

        Title = title.Trim();
        Price = price;
        MediaUrl = mediaUrl.Trim();
        IsVideo = isVideo;
        StockQuantity = stockQuantity;
    }

    public void UpdatePrice(decimal newPrice)
    {
        if (newPrice < 0)
            throw new ArgumentException("Product price cannot be negative.", nameof(newPrice));

        Price = newPrice;
    }

    public void ReduceStock(int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity to reduce must be strictly positive.", nameof(quantity));

        if (quantity > StockQuantity)
            throw new InvalidOperationException("Insufficient stock available.");

        StockQuantity -= quantity;
    }

    public void Restock(int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity to restock must be strictly positive.", nameof(quantity));

        StockQuantity += quantity;
    }

    public void AddReviewRating(int newStarRating)
    {
        if (newStarRating < 1 || newStarRating > 5)
            throw new ArgumentException("Star rating must be between 1 and 5.", nameof(newStarRating));

        var currentTotal = ReviewCount == 0 ? 0 : RatingAverage * ReviewCount;
        ReviewCount++;
        RatingAverage = Math.Round((currentTotal + newStarRating) / ReviewCount, 2);
    }
}

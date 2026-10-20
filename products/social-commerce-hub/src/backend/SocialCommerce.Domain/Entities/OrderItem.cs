namespace SocialCommerce.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductTitle { get; private set; } = string.Empty;
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public decimal Subtotal => UnitPrice * Quantity;

    // Parameterless constructor required by EF Core
    private OrderItem() { }

    public OrderItem(Guid productId, string productTitle, decimal unitPrice, int quantity)
    {
        if (productId == Guid.Empty)
            throw new ArgumentException("Product ID cannot be empty.", nameof(productId));

        if (string.IsNullOrWhiteSpace(productTitle))
            throw new ArgumentException("Product title cannot be empty.", nameof(productTitle));

        if (unitPrice < 0)
            throw new ArgumentException("Unit price cannot be negative.", nameof(unitPrice));

        if (quantity <= 0)
            throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));

        Id = Guid.NewGuid();
        ProductId = productId;
        ProductTitle = productTitle.Trim();
        UnitPrice = unitPrice;
        Quantity = quantity;
    }
}

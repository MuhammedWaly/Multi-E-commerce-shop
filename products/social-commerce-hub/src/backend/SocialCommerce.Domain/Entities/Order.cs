namespace SocialCommerce.Domain.Entities;

public class Order
{
    private readonly List<OrderItem> _items = new();

    public Guid Id { get; private set; }
    public Guid MerchantId { get; private set; }
    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerEmail { get; private set; } = string.Empty;
    public string ShippingAddress { get; private set; } = string.Empty;
    public OrderStatus Status { get; private set; }
    public decimal PlatformFeeRate { get; private set; }
    public decimal TotalAmount { get; private set; }
    public decimal PlatformFeeAmount { get; private set; }
    public decimal MerchantNetAmount { get; private set; }
    public string? PaymentOrderId { get; private set; }
    public string? PaymentTransactionId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? PaidAtUtc { get; private set; }

    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();

    // Parameterless constructor required by EF Core
    private Order() { }

    public Order(
        Guid merchantId,
        string customerName,
        string customerEmail,
        string shippingAddress,
        IEnumerable<OrderItem> items,
        decimal platformFeeRate = 0.05m)
    {
        if (merchantId == Guid.Empty)
            throw new ArgumentException("Merchant ID cannot be empty.", nameof(merchantId));

        if (string.IsNullOrWhiteSpace(customerName))
            throw new ArgumentException("Customer name cannot be empty.", nameof(customerName));

        if (string.IsNullOrWhiteSpace(customerEmail))
            throw new ArgumentException("Customer email cannot be empty.", nameof(customerEmail));

        if (string.IsNullOrWhiteSpace(shippingAddress))
            throw new ArgumentException("Shipping address cannot be empty.", nameof(shippingAddress));

        if (platformFeeRate < 0 || platformFeeRate > 1)
            throw new ArgumentException("Platform fee rate must be between 0 and 1.", nameof(platformFeeRate));

        var itemList = items?.ToList() ?? throw new ArgumentNullException(nameof(items));
        if (itemList.Count == 0)
            throw new ArgumentException("Order must contain at least one item.", nameof(items));

        Id = Guid.NewGuid();
        MerchantId = merchantId;
        CustomerName = customerName.Trim();
        CustomerEmail = customerEmail.Trim().ToLowerInvariant();
        ShippingAddress = shippingAddress.Trim();
        PlatformFeeRate = platformFeeRate;
        Status = OrderStatus.PendingPayment;
        CreatedAtUtc = DateTime.UtcNow;

        _items.AddRange(itemList);
        CalculateTotals();
    }

    private void CalculateTotals()
    {
        TotalAmount = _items.Sum(i => i.Subtotal);
        PlatformFeeAmount = Math.Round(TotalAmount * PlatformFeeRate, 2);
        MerchantNetAmount = TotalAmount - PlatformFeeAmount;
    }

    public void AssignPaymentOrderId(string paymentOrderId)
    {
        if (string.IsNullOrWhiteSpace(paymentOrderId))
            throw new ArgumentException("Payment order ID cannot be empty.", nameof(paymentOrderId));

        if (Status != OrderStatus.PendingPayment)
            throw new InvalidOperationException("Cannot assign payment order ID to an order that is not pending payment.");

        PaymentOrderId = paymentOrderId.Trim();
    }

    public void MarkAsPaid(string transactionId)
    {
        if (string.IsNullOrWhiteSpace(transactionId))
            throw new ArgumentException("Transaction ID cannot be empty.", nameof(transactionId));

        if (Status != OrderStatus.PendingPayment)
            throw new InvalidOperationException($"Cannot pay order with current status: {Status}.");

        PaymentTransactionId = transactionId.Trim();
        Status = OrderStatus.Paid;
        PaidAtUtc = DateTime.UtcNow;
    }

    public void MarkAsFulfilled()
    {
        if (Status != OrderStatus.Paid)
            throw new InvalidOperationException("Only paid orders can be fulfilled.");

        Status = OrderStatus.Fulfilled;
    }

    public void Cancel()
    {
        if (Status == OrderStatus.Fulfilled)
            throw new InvalidOperationException("Fulfilled orders cannot be cancelled.");

        Status = OrderStatus.Cancelled;
    }
}

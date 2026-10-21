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
    public string PaymentMethod { get; private set; } = "PayPal";
    public string? PaymentReference { get; private set; }
    public string? PaymentInstructions { get; private set; }
    public DateTime? PaymentExpiresAtUtc { get; private set; }
    public string? SenderWalletOrReference { get; private set; }
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
        decimal platformFeeRate = 0.05m,
        string? paymentMethod = "PayPal",
        OrderStatus? initialStatus = null,
        string? paymentReference = null,
        string? paymentInstructions = null,
        DateTime? paymentExpiresAtUtc = null,
        string? senderWalletOrReference = null)
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
        PaymentMethod = string.IsNullOrWhiteSpace(paymentMethod) ? "PayPal" : paymentMethod.Trim();
        PaymentReference = paymentReference?.Trim();
        PaymentInstructions = paymentInstructions?.Trim();
        PaymentExpiresAtUtc = paymentExpiresAtUtc;
        SenderWalletOrReference = senderWalletOrReference?.Trim();

        if (initialStatus.HasValue)
        {
            Status = initialStatus.Value;
        }
        else
        {
            var norm = PaymentMethod.ToLowerInvariant();
            if (norm is "cashondelivery" or "cod" or "cash")
                Status = OrderStatus.Pending;
            else if (norm is "fawry" or "fawrypay")
                Status = OrderStatus.AwaitingPayment;
            else if (norm is "instapay" or "mobilewallet" or "vodafonecash" or "orangemoney" or "etisalatcash" or "wepay")
                Status = OrderStatus.Processing;
            else
                Status = OrderStatus.PendingPayment;
        }

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

        if (Status != OrderStatus.PendingPayment &&
            Status != OrderStatus.Pending &&
            Status != OrderStatus.AwaitingPayment &&
            Status != OrderStatus.Processing)
        {
            throw new InvalidOperationException($"Cannot assign payment order ID to an order with current status: {Status}.");
        }

        PaymentOrderId = paymentOrderId.Trim();
    }

    public void MarkAsPaid(string transactionId)
    {
        if (string.IsNullOrWhiteSpace(transactionId))
            throw new ArgumentException("Transaction ID cannot be empty.", nameof(transactionId));

        if (Status != OrderStatus.PendingPayment &&
            Status != OrderStatus.Pending &&
            Status != OrderStatus.AwaitingPayment &&
            Status != OrderStatus.Processing)
        {
            throw new InvalidOperationException($"Cannot pay order with current status: {Status}.");
        }

        PaymentTransactionId = transactionId.Trim();
        Status = OrderStatus.Paid;
        PaidAtUtc = DateTime.UtcNow;
    }

    public void SetPaymentDetails(
        string? reference,
        string? instructions = null,
        DateTime? expiresAtUtc = null,
        string? senderWalletOrReference = null)
    {
        if (!string.IsNullOrWhiteSpace(reference))
            PaymentReference = reference.Trim();

        if (!string.IsNullOrWhiteSpace(instructions))
            PaymentInstructions = instructions.Trim();

        if (expiresAtUtc.HasValue)
            PaymentExpiresAtUtc = expiresAtUtc;

        if (!string.IsNullOrWhiteSpace(senderWalletOrReference))
            SenderWalletOrReference = senderWalletOrReference.Trim();
    }

    public void MarkAsFulfilled()
    {
        if (Status != OrderStatus.Paid && !(Status == OrderStatus.Pending && (PaymentMethod.Equals("CashOnDelivery", StringComparison.OrdinalIgnoreCase) || PaymentMethod.Equals("COD", StringComparison.OrdinalIgnoreCase))))
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

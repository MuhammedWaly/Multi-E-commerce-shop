namespace SocialCommerce.Domain.Entities;

public enum LedgerEntryType
{
    CreditSale = 1,
    FeeDeduction = 2,
    Payout = 3
}

public class MerchantLedgerEntry
{
    public Guid Id { get; private set; }
    public Guid MerchantId { get; private set; }
    public Guid? OrderId { get; private set; }
    public LedgerEntryType Type { get; private set; }
    public decimal Amount { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    // Parameterless constructor required by EF Core
    private MerchantLedgerEntry() { }

    public MerchantLedgerEntry(Guid merchantId, Guid? orderId, LedgerEntryType type, decimal amount, string description)
    {
        if (merchantId == Guid.Empty)
            throw new ArgumentException("Merchant ID cannot be empty.", nameof(merchantId));

        if (amount <= 0)
            throw new ArgumentException("Ledger entry amount must be strictly positive.", nameof(amount));

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description cannot be empty.", nameof(description));

        Id = Guid.NewGuid();
        MerchantId = merchantId;
        OrderId = orderId;
        Type = type;
        Amount = amount;
        Description = description.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }
}

namespace SocialCommerce.Domain.Entities;

public class Merchant
{
    public Guid Id { get; private set; }
    public string StoreName { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public decimal Balance { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    // Parameterless constructor required by EF Core
    private Merchant() { }

    public Merchant(string storeName, string slug, string email)
    {
        if (string.IsNullOrWhiteSpace(storeName))
            throw new ArgumentException("Store name cannot be empty.", nameof(storeName));

        if (string.IsNullOrWhiteSpace(slug))
            throw new ArgumentException("Store slug cannot be empty.", nameof(slug));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty.", nameof(email));

        Id = Guid.NewGuid();
        StoreName = storeName.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        Email = email.Trim().ToLowerInvariant();
        Balance = 0m;
        IsActive = true;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void CreditBalance(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Credit amount must be strictly positive.", nameof(amount));

        Balance += amount;
    }

    public void PayoutBalance(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Payout amount must be strictly positive.", nameof(amount));

        if (amount > Balance)
            throw new InvalidOperationException("Insufficient merchant balance for payout.");

        Balance -= amount;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
    }
}

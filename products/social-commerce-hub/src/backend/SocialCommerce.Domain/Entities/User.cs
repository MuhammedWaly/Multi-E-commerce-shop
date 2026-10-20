namespace SocialCommerce.Domain.Entities;

public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string Salt { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public Guid? MerchantId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private User() { }

    public User(
        string email,
        string passwordHash,
        string salt,
        string fullName,
        UserRole role = UserRole.Customer,
        Guid? merchantId = null)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty.", nameof(email));

        if (!email.Contains('@') || !email.Contains('.'))
            throw new ArgumentException("Email format is invalid.", nameof(email));

        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password hash cannot be empty.", nameof(passwordHash));

        if (string.IsNullOrWhiteSpace(salt))
            throw new ArgumentException("Password salt cannot be empty.", nameof(salt));

        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Full name cannot be empty.", nameof(fullName));

        if (role == UserRole.Merchant && merchantId == null)
            throw new ArgumentException("Merchant role requires a valid MerchantId.", nameof(merchantId));

        Id = Guid.NewGuid();
        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        Salt = salt;
        FullName = fullName.Trim();
        Role = role;
        MerchantId = merchantId;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void LinkMerchant(Guid merchantId)
    {
        if (merchantId == Guid.Empty)
            throw new ArgumentException("MerchantId cannot be empty.", nameof(merchantId));

        MerchantId = merchantId;
        Role = UserRole.Merchant;
    }

    public void UnlinkMerchant()
    {
        MerchantId = null;
        Role = UserRole.Customer;
    }
}

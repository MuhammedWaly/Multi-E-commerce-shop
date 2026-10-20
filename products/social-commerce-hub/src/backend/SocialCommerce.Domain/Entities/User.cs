namespace SocialCommerce.Domain.Entities;

public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string Salt { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string? PhoneNumber { get; private set; }
    public string? AvatarUrl { get; private set; }
    public UserRole Role { get; private set; }
    public Guid? MerchantId { get; private set; }
    public bool IsEmailConfirmed { get; private set; }
    public string? EmailConfirmationToken { get; private set; }
    public DateTime? EmailConfirmationTokenExpiresUtc { get; private set; }
    public string? PasswordResetToken { get; private set; }
    public DateTime? PasswordResetTokenExpiresUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private User() { }

    public User(
        string email,
        string passwordHash,
        string salt,
        string fullName,
        UserRole role = UserRole.Customer,
        Guid? merchantId = null,
        bool isEmailConfirmed = false,
        string? phoneNumber = null,
        string? avatarUrl = null)
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
        IsEmailConfirmed = isEmailConfirmed;
        PhoneNumber = phoneNumber?.Trim();
        AvatarUrl = avatarUrl?.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void UpdateProfile(string fullName, string? phoneNumber, string? avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Full name cannot be empty.", nameof(fullName));

        FullName = fullName.Trim();
        PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim();
        AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl.Trim();
    }

    public void ChangePassword(string newPasswordHash, string newSalt)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new ArgumentException("Password hash cannot be empty.", nameof(newPasswordHash));

        if (string.IsNullOrWhiteSpace(newSalt))
            throw new ArgumentException("Password salt cannot be empty.", nameof(newSalt));

        PasswordHash = newPasswordHash;
        Salt = newSalt;
        // Invalidate any outstanding password reset token
        PasswordResetToken = null;
        PasswordResetTokenExpiresUtc = null;
    }

    public void SetEmailConfirmationToken(string token, DateTime expiresUtc)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Confirmation token cannot be empty.", nameof(token));

        EmailConfirmationToken = token;
        EmailConfirmationTokenExpiresUtc = expiresUtc;
    }

    public void ConfirmEmail(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Confirmation token cannot be empty.", nameof(token));

        if (IsEmailConfirmed)
            return; // Already confirmed

        if (EmailConfirmationToken != token)
            throw new InvalidOperationException("Invalid email confirmation token.");

        if (EmailConfirmationTokenExpiresUtc.HasValue && EmailConfirmationTokenExpiresUtc.Value < DateTime.UtcNow)
            throw new InvalidOperationException("Email confirmation token has expired. Please request a new confirmation email.");

        IsEmailConfirmed = true;
        EmailConfirmationToken = null;
        EmailConfirmationTokenExpiresUtc = null;
    }

    public void MarkEmailAsConfirmed()
    {
        IsEmailConfirmed = true;
        EmailConfirmationToken = null;
        EmailConfirmationTokenExpiresUtc = null;
    }

    public void SetPasswordResetToken(string token, DateTime expiresUtc)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Reset token cannot be empty.", nameof(token));

        PasswordResetToken = token;
        PasswordResetTokenExpiresUtc = expiresUtc;
    }

    public void ResetPassword(string token, string newPasswordHash, string newSalt)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Reset token cannot be empty.", nameof(token));

        if (string.IsNullOrWhiteSpace(PasswordResetToken) || PasswordResetToken != token)
            throw new InvalidOperationException("Invalid password reset token.");

        if (PasswordResetTokenExpiresUtc.HasValue && PasswordResetTokenExpiresUtc.Value < DateTime.UtcNow)
            throw new InvalidOperationException("Password reset token has expired. Please request a new reset link.");

        ChangePassword(newPasswordHash, newSalt);
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

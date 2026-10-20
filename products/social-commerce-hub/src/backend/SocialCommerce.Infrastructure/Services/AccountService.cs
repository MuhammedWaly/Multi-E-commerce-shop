using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Infrastructure.Persistence;

namespace SocialCommerce.Infrastructure.Services;

public class AccountService : IAccountService
{
    private readonly SocialCommerceDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IEmailService _emailService;

    public AccountService(
        SocialCommerceDbContext db,
        IPasswordHasher hasher,
        IEmailService emailService)
    {
        _db = db;
        _hasher = hasher;
        _emailService = emailService;
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID '{userId}' was not found.");
        }

        string? storeSlug = null;
        if (user.MerchantId.HasValue)
        {
            var merchant = await _db.Merchants.FirstOrDefaultAsync(m => m.Id == user.MerchantId.Value, ct);
            storeSlug = merchant?.Slug;
        }

        return MapToDto(user, storeSlug);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Full name is required.", nameof(request.FullName));
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID '{userId}' was not found.");
        }

        user.UpdateProfile(request.FullName, request.PhoneNumber, request.AvatarUrl);
        await _db.SaveChangesAsync(ct);

        string? storeSlug = null;
        if (user.MerchantId.HasValue)
        {
            var merchant = await _db.Merchants.FirstOrDefaultAsync(m => m.Id == user.MerchantId.Value, ct);
            storeSlug = merchant?.Slug;
        }

        return MapToDto(user, storeSlug);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            throw new ArgumentException("Current password is required.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            throw new ArgumentException("New password must be at least 6 characters.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID '{userId}' was not found.");
        }

        if (!_hasher.VerifyPassword(request.CurrentPassword, user.PasswordHash, user.Salt))
        {
            throw new ArgumentException("Current password is incorrect.");
        }

        var newHash = _hasher.HashPassword(request.NewPassword, out var newSalt);
        user.ChangePassword(newHash, newSalt);

        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ArgumentException("Email address is required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        if (user != null)
        {
            var token = GenerateSecureToken();
            var expires = DateTime.UtcNow.AddHours(2);
            user.SetPasswordResetToken(token, expires);
            await _db.SaveChangesAsync(ct);

            await _emailService.SendPasswordResetAsync(user.Email, user.FullName, token, ct);
        }

        // Always return true to prevent user enumeration
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email address is required.");

        if (string.IsNullOrWhiteSpace(request.ResetToken))
            throw new ArgumentException("Reset token is required.");

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            throw new ArgumentException("New password must be at least 6 characters.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        if (user == null)
        {
            throw new ArgumentException("Invalid email or reset token.");
        }

        var newHash = _hasher.HashPassword(request.NewPassword, out var newSalt);
        user.ResetPassword(request.ResetToken.Trim(), newHash, newSalt);

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email address is required.");

        if (string.IsNullOrWhiteSpace(request.Token))
            throw new ArgumentException("Confirmation token is required.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        if (user == null)
        {
            throw new ArgumentException("Invalid email or confirmation token.");
        }

        user.ConfirmEmail(request.Token.Trim());
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ResendConfirmationEmailAsync(ResendConfirmationRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email address is required.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        if (user != null && !user.IsEmailConfirmed)
        {
            var token = GenerateSecureToken();
            var expires = DateTime.UtcNow.AddDays(1);
            user.SetEmailConfirmationToken(token, expires);
            await _db.SaveChangesAsync(ct);

            await _emailService.SendEmailConfirmationAsync(user.Email, user.FullName, token, ct);
        }

        return true;
    }

    private static UserProfileDto MapToDto(Domain.Entities.User user, string? storeSlug)
    {
        return new UserProfileDto(
            user.Id,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            user.AvatarUrl,
            user.Role.ToString(),
            user.MerchantId,
            storeSlug,
            user.IsEmailConfirmed,
            user.CreatedAtUtc
        );
    }

    private static string GenerateSecureToken()
    {
        var randomBytes = new byte[32];
        RandomNumberGenerator.Fill(randomBytes);
        return Convert.ToHexString(randomBytes).ToLowerInvariant();
    }
}

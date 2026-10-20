using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;

namespace SocialCommerce.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly SocialCommerceDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;

    public AuthService(
        SocialCommerceDbContext db,
        IPasswordHasher hasher,
        IJwtTokenService jwt)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.", nameof(request.Email));

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            throw new ArgumentException("Password must be at least 6 characters.", nameof(request.Password));

        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Full name is required.", nameof(request.FullName));

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _db.Users.AnyAsync(u => u.Email == normalizedEmail, ct);
        if (existingUser)
        {
            throw new ArgumentException("An account with this email address already exists.");
        }

        var roleStr = request.Role?.Trim() ?? "Customer";
        var isMerchant = roleStr.Equals("Merchant", StringComparison.OrdinalIgnoreCase);
        var role = isMerchant ? UserRole.Merchant : UserRole.Customer;

        Guid? merchantId = null;
        string? storeSlug = null;

        if (isMerchant)
        {
            var storeName = string.IsNullOrWhiteSpace(request.StoreName) ? $"{request.FullName}'s Store" : request.StoreName.Trim();
            var rawSlug = string.IsNullOrWhiteSpace(request.StoreSlug) 
                ? storeName.ToLowerInvariant().Replace(" ", "-").Replace("'", "")
                : request.StoreSlug.Trim().ToLowerInvariant();

            // Ensure unique slug
            var finalSlug = rawSlug;
            var counter = 1;
            while (await _db.Merchants.AnyAsync(m => m.Slug == finalSlug, ct))
            {
                finalSlug = $"{rawSlug}-{counter++}";
            }

            var merchant = new Merchant(storeName, finalSlug, normalizedEmail);
            _db.Merchants.Add(merchant);
            await _db.SaveChangesAsync(ct);

            merchantId = merchant.Id;
            storeSlug = merchant.Slug;
        }

        var hash = _hasher.HashPassword(request.Password, out var salt);
        var user = new User(normalizedEmail, hash, salt, request.FullName, role, merchantId);

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        var token = _jwt.GenerateToken(user, storeSlug);

        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.MerchantId,
            storeSlug
        );

        return new AuthResponseDto(token, userDto);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.");

        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        if (user == null || !_hasher.VerifyPassword(request.Password, user.PasswordHash, user.Salt))
        {
            throw new ArgumentException("Invalid email or password.");
        }

        string? storeSlug = null;
        if (user.MerchantId.HasValue)
        {
            var merchant = await _db.Merchants.FirstOrDefaultAsync(m => m.Id == user.MerchantId.Value, ct);
            storeSlug = merchant?.Slug;
        }

        var token = _jwt.GenerateToken(user, storeSlug);

        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.MerchantId,
            storeSlug
        );

        return new AuthResponseDto(token, userDto);
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null) return null;

        string? storeSlug = null;
        if (user.MerchantId.HasValue)
        {
            var merchant = await _db.Merchants.FirstOrDefaultAsync(m => m.Id == user.MerchantId.Value, ct);
            storeSlug = merchant?.Slug;
        }

        return new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.MerchantId,
            storeSlug
        );
    }
}

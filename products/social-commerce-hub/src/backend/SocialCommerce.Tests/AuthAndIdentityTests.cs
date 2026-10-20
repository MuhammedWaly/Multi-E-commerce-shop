using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class AuthAndIdentityTests
{
    [Fact]
    public void PasswordHasher_HashesAndVerifiesPasswordCorrectly()
    {
        var hasher = new PasswordHasher();
        var password = "SecurePassword123!";

        var hash = hasher.HashPassword(password, out var salt);

        Assert.False(string.IsNullOrWhiteSpace(hash));
        Assert.False(string.IsNullOrWhiteSpace(salt));

        var isValid = hasher.VerifyPassword(password, hash, salt);
        Assert.True(isValid);

        var isInvalid = hasher.VerifyPassword("WrongPassword", hash, salt);
        Assert.False(isInvalid);
    }

    [Fact]
    public void JwtTokenService_GeneratesValidToken_WithMerchantClaims()
    {
        var config = new ConfigurationBuilder().Build();
        var jwt = new JwtTokenService(config);

        var merchantId = Guid.NewGuid();
        var user = new User("merchant@example.com", "hash", "salt", "Boutique Owner", UserRole.Merchant, merchantId);

        var token = jwt.GenerateToken(user, "boutique-slug");

        Assert.False(string.IsNullOrWhiteSpace(token));
        Assert.Contains(".", token);
    }

    [Fact]
    public void User_RequiresValidEmail_AndMerchantIdForMerchantRole()
    {
        Assert.Throws<ArgumentException>(() =>
            new User("invalid-email", "hash", "salt", "User Name", UserRole.Customer));

        Assert.Throws<ArgumentException>(() =>
            new User("merchant@example.com", "hash", "salt", "Merchant", UserRole.Merchant, null));

        var merchantId = Guid.NewGuid();
        var validMerchantUser = new User("merchant@example.com", "hash", "salt", "Merchant", UserRole.Merchant, merchantId);

        Assert.Equal(UserRole.Merchant, validMerchantUser.Role);
        Assert.Equal(merchantId, validMerchantUser.MerchantId);
    }

    [Fact]
    public async Task AuthService_RegistersCustomerAndMerchant_Successfully()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        try
        {
            var options = new DbContextOptionsBuilder<SocialCommerceDbContext>()
                .UseSqlite(connection)
                .Options;

            using var db = new SocialCommerceDbContext(options);
            await db.Database.EnsureCreatedAsync();

            var hasher = new PasswordHasher();
            var jwt = new JwtTokenService(new ConfigurationBuilder().Build());
            var auth = new AuthService(db, hasher, jwt);

            // 1. Register Customer
            var customerReq = new RegisterRequest("customer@test.com", "Password123!", "Customer One", "Customer");
            var customerRes = await auth.RegisterAsync(customerReq);

            Assert.False(string.IsNullOrWhiteSpace(customerRes.Token));
            Assert.Equal("Customer", customerRes.User.Role);
            Assert.Null(customerRes.User.MerchantId);

            // 2. Register Merchant with Store
            var merchantReq = new RegisterRequest("merchant@test.com", "Password123!", "Maker One", "Merchant", "Maker Studio", "maker-studio");
            var merchantRes = await auth.RegisterAsync(merchantReq);

            Assert.False(string.IsNullOrWhiteSpace(merchantRes.Token));
            Assert.Equal("Merchant", merchantRes.User.Role);
            Assert.NotNull(merchantRes.User.MerchantId);
            Assert.Equal("maker-studio", merchantRes.User.StoreSlug);

            // 3. Login Customer
            var loginRes = await auth.LoginAsync(new LoginRequest("customer@test.com", "Password123!"));
            Assert.Equal("customer@test.com", loginRes.User.Email);

            // 4. Duplicate Registration Rejection
            await Assert.ThrowsAsync<ArgumentException>(() =>
                auth.RegisterAsync(new RegisterRequest("customer@test.com", "NewPassword!", "Duplicate", "Customer")));
        }
        finally
        {
            await connection.CloseAsync();
        }
    }
}

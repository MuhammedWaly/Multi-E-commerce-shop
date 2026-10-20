using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class UserAccountAndSecurityTests
{
    private async Task<(SocialCommerceDbContext db, SqliteConnection conn)> CreateTestDbAsync()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SocialCommerceDbContext>()
            .UseSqlite(connection)
            .Options;

        var db = new SocialCommerceDbContext(options);
        await db.Database.EnsureCreatedAsync();

        return (db, connection);
    }

    [Fact]
    public async Task GetProfileAsync_ReturnsCorrectUserProfile()
    {
        // Arrange
        var (db, conn) = await CreateTestDbAsync();
        try
        {
            var hasher = new PasswordHasher();
            var emailService = new EmailService(NullLogger<EmailService>.Instance);
            var accountService = new AccountService(db, hasher, emailService);

            var hash = hasher.HashPassword("SecurePass123!", out var salt);
            var user = new User("sarah@boutique.eg", hash, salt, "Sarah Nabil", UserRole.Customer, phoneNumber: "+201001112233");
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Act
            var profile = await accountService.GetProfileAsync(user.Id);

            // Assert
            Assert.NotNull(profile);
            Assert.Equal("sarah@boutique.eg", profile.Email);
            Assert.Equal("Sarah Nabil", profile.FullName);
            Assert.Equal("+201001112233", profile.PhoneNumber);
            Assert.Equal("Customer", profile.Role);
            Assert.False(profile.IsEmailConfirmed);
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    [Fact]
    public async Task UpdateProfileAsync_UpdatesFullNamePhoneAndAvatar()
    {
        // Arrange
        var (db, conn) = await CreateTestDbAsync();
        try
        {
            var hasher = new PasswordHasher();
            var emailService = new EmailService(NullLogger<EmailService>.Instance);
            var accountService = new AccountService(db, hasher, emailService);

            var hash = hasher.HashPassword("SecurePass123!", out var salt);
            var user = new User("tarek@fashion.eg", hash, salt, "Tarek OldName", UserRole.Customer);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var updateReq = new UpdateProfileRequest("Tarek Updated", "+201223344556", "https://cdn.example.com/avatar.jpg");

            // Act
            var updated = await accountService.UpdateProfileAsync(user.Id, updateReq);

            // Assert
            Assert.Equal("Tarek Updated", updated.FullName);
            Assert.Equal("+201223344556", updated.PhoneNumber);
            Assert.Equal("https://cdn.example.com/avatar.jpg", updated.AvatarUrl);

            var savedUser = await db.Users.FindAsync(user.Id);
            Assert.NotNull(savedUser);
            Assert.Equal("Tarek Updated", savedUser.FullName);
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    [Fact]
    public async Task ChangePasswordAsync_WithValidCurrentPassword_ChangesPasswordSuccessfully()
    {
        // Arrange
        var (db, conn) = await CreateTestDbAsync();
        try
        {
            var hasher = new PasswordHasher();
            var emailService = new EmailService(NullLogger<EmailService>.Instance);
            var accountService = new AccountService(db, hasher, emailService);

            var oldHash = hasher.HashPassword("OldPassword123!", out var oldSalt);
            var user = new User("khaled@test.eg", oldHash, oldSalt, "Khaled", UserRole.Customer);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Act
            await accountService.ChangePasswordAsync(user.Id, new ChangePasswordRequest("OldPassword123!", "NewSecret456!"));

            // Assert
            var updatedUser = await db.Users.FindAsync(user.Id);
            Assert.NotNull(updatedUser);
            Assert.True(hasher.VerifyPassword("NewSecret456!", updatedUser.PasswordHash, updatedUser.Salt));
            Assert.False(hasher.VerifyPassword("OldPassword123!", updatedUser.PasswordHash, updatedUser.Salt));
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    [Fact]
    public async Task ChangePasswordAsync_WithInvalidCurrentPassword_ThrowsArgumentException()
    {
        // Arrange
        var (db, conn) = await CreateTestDbAsync();
        try
        {
            var hasher = new PasswordHasher();
            var emailService = new EmailService(NullLogger<EmailService>.Instance);
            var accountService = new AccountService(db, hasher, emailService);

            var oldHash = hasher.HashPassword("CorrectPassword1!", out var oldSalt);
            var user = new User("khaled2@test.eg", oldHash, oldSalt, "Khaled", UserRole.Customer);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                accountService.ChangePasswordAsync(user.Id, new ChangePasswordRequest("WrongPassword!", "NewSecret456!")));
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    [Fact]
    public async Task ForgotPasswordAndResetPassword_FlowWorksEndToEnd()
    {
        // Arrange
        var (db, conn) = await CreateTestDbAsync();
        try
        {
            var hasher = new PasswordHasher();
            var emailService = new EmailService(NullLogger<EmailService>.Instance);
            var accountService = new AccountService(db, hasher, emailService);

            var hash = hasher.HashPassword("InitialPass1!", out var salt);
            var user = new User("resetme@example.com", hash, salt, "Reset User", UserRole.Customer);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Act 1: Request Forgot Password
            var forgotResult = await accountService.ForgotPasswordAsync(new ForgotPasswordRequest("resetme@example.com"));
            Assert.True(forgotResult);

            var userWithToken = await db.Users.FindAsync(user.Id);
            Assert.NotNull(userWithToken);
            Assert.False(string.IsNullOrWhiteSpace(userWithToken.PasswordResetToken));
            Assert.True(userWithToken.PasswordResetTokenExpiresUtc > DateTime.UtcNow);

            var resetToken = userWithToken.PasswordResetToken;

            // Act 2: Reset Password with valid token
            var resetResult = await accountService.ResetPasswordAsync(
                new ResetPasswordRequest("resetme@example.com", resetToken, "BrandNewPassword999!"));
            Assert.True(resetResult);

            // Assert: New password verified
            var finalUser = await db.Users.FindAsync(user.Id);
            Assert.NotNull(finalUser);
            Assert.True(hasher.VerifyPassword("BrandNewPassword999!", finalUser.PasswordHash, finalUser.Salt));
            Assert.Null(finalUser.PasswordResetToken); // Token cleared
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    [Fact]
    public async Task ResetPassword_WithExpiredToken_ThrowsInvalidOperationException()
    {
        // Arrange
        var (db, conn) = await CreateTestDbAsync();
        try
        {
            var hasher = new PasswordHasher();
            var emailService = new EmailService(NullLogger<EmailService>.Instance);
            var accountService = new AccountService(db, hasher, emailService);

            var hash = hasher.HashPassword("InitialPass1!", out var salt);
            var user = new User("expired@example.com", hash, salt, "Expired User", UserRole.Customer);
            user.SetPasswordResetToken("expired_token_123", DateTime.UtcNow.AddMinutes(-10)); // Expired in past
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                accountService.ResetPasswordAsync(new ResetPasswordRequest("expired@example.com", "expired_token_123", "NewPass123!")));
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    [Fact]
    public async Task ConfirmEmailAsync_WithValidToken_MarksEmailAsConfirmed()
    {
        // Arrange
        var (db, conn) = await CreateTestDbAsync();
        try
        {
            var hasher = new PasswordHasher();
            var emailService = new EmailService(NullLogger<EmailService>.Instance);
            var accountService = new AccountService(db, hasher, emailService);

            var hash = hasher.HashPassword("Pass1234!", out var salt);
            var user = new User("verify@example.com", hash, salt, "Verify User", UserRole.Customer);
            user.SetEmailConfirmationToken("valid_verify_token_77", DateTime.UtcNow.AddDays(1));
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Act
            var result = await accountService.ConfirmEmailAsync(new ConfirmEmailRequest("verify@example.com", "valid_verify_token_77"));

            // Assert
            Assert.True(result);
            var confirmedUser = await db.Users.FindAsync(user.Id);
            Assert.NotNull(confirmedUser);
            Assert.True(confirmedUser.IsEmailConfirmed);
            Assert.Null(confirmedUser.EmailConfirmationToken);
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    [Fact]
    public async Task ConfirmEmailAsync_WithInvalidToken_ThrowsInvalidOperationException()
    {
        // Arrange
        var (db, conn) = await CreateTestDbAsync();
        try
        {
            var hasher = new PasswordHasher();
            var emailService = new EmailService(NullLogger<EmailService>.Instance);
            var accountService = new AccountService(db, hasher, emailService);

            var hash = hasher.HashPassword("Pass1234!", out var salt);
            var user = new User("fake@example.com", hash, salt, "Fake Token", UserRole.Customer);
            user.SetEmailConfirmationToken("token_abc", DateTime.UtcNow.AddDays(1));
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                accountService.ConfirmEmailAsync(new ConfirmEmailRequest("fake@example.com", "wrong_token_xyz")));
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    [Fact]
    public async Task ResendConfirmationEmail_DispatchesNewToken()
    {
        // Arrange
        var (db, conn) = await CreateTestDbAsync();
        try
        {
            var hasher = new PasswordHasher();
            var emailService = new EmailService(NullLogger<EmailService>.Instance);
            var accountService = new AccountService(db, hasher, emailService);

            var hash = hasher.HashPassword("Pass1234!", out var salt);
            var user = new User("resend@example.com", hash, salt, "Resend User", UserRole.Customer);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Act
            var result = await accountService.ResendConfirmationEmailAsync(new ResendConfirmationRequest("resend@example.com"));

            // Assert
            Assert.True(result);
            var updatedUser = await db.Users.FindAsync(user.Id);
            Assert.NotNull(updatedUser);
            Assert.False(string.IsNullOrWhiteSpace(updatedUser.EmailConfirmationToken));
        }
        finally
        {
            await conn.CloseAsync();
        }
    }
}

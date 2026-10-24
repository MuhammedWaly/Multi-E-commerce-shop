using Microsoft.EntityFrameworkCore;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Services;

namespace SocialCommerce.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(SocialCommerceDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // Apply schema updates safely to existing SQLite database if needed
        await EnsureUserColumnsExistAsync(context);
        await EnsureOrderColumnsExistAsync(context);
        await EnsureMerchantColumnsExistAsync(context);
        await EnsureDataSanityAsync(context);

        Merchant? sariMerchant = null;
        Merchant? cairoLeather = null;

        if (!await context.Merchants.AnyAsync())
        {
            sariMerchant = new Merchant("Sari Boutique", "sari-boutique", "sari@example.com");
            cairoLeather = new Merchant("Cairo Leather Craft", "cairo-leather", "craft@example.com");

            context.Merchants.AddRange(sariMerchant, cairoLeather);
            await context.SaveChangesAsync();

            var products = new List<Product>
            {
                new Product(sariMerchant.Id, "Oversized Beige Linen Shirt", 650m, "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800", false, 15),
                new Product(sariMerchant.Id, "Summer Silk Scarf", 320m, "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800", false, 25),
                new Product(cairoLeather.Id, "Handmade Genuine Leather Bag", 1250m, "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800", false, 8),
                new Product(cairoLeather.Id, "Classic Leather Cardholder", 280m, "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800", false, 30)
            };

            context.Products.AddRange(products);
            await context.SaveChangesAsync();
        }

        if (!await context.Users.AnyAsync())
        {
            sariMerchant ??= await context.Merchants.FirstOrDefaultAsync(m => m.Slug == "sari-boutique");
            cairoLeather ??= await context.Merchants.FirstOrDefaultAsync(m => m.Slug == "cairo-leather");

            var hasher = new PasswordHasher();

            var customerHash = hasher.HashPassword("Password123!", out var customerSalt);
            var customerUser = new User("customer@example.com", customerHash, customerSalt, "Youssef El-Gohary", UserRole.Customer, null, isEmailConfirmed: true, phoneNumber: "+201001234567");

            var sariHash = hasher.HashPassword("Password123!", out var sariSalt);
            var sariUser = new User("sari@example.com", sariHash, sariSalt, "Sari Boutique Owner", UserRole.Merchant, sariMerchant?.Id, isEmailConfirmed: true, phoneNumber: "+201009876543");

            var cairoHash = hasher.HashPassword("Password123!", out var cairoSalt);
            var cairoUser = new User("craft@example.com", cairoHash, cairoSalt, "Cairo Leather Maker", UserRole.Merchant, cairoLeather?.Id, isEmailConfirmed: true, phoneNumber: "+201011223344");

            var adminHash = hasher.HashPassword("Password123!", out var adminSalt);
            var adminUser = new User("admin@socialhub.eg", adminHash, adminSalt, "Platform Administrator", UserRole.Admin, null, isEmailConfirmed: true, phoneNumber: "+201099887766");

            context.Users.AddRange(customerUser, sariUser, cairoUser, adminUser);
            await context.SaveChangesAsync();
        }
    }

    private static async Task EnsureUserColumnsExistAsync(SocialCommerceDbContext context)
    {
        var columns = new[]
        {
            "ALTER TABLE Users ADD COLUMN PhoneNumber TEXT NULL;",
            "ALTER TABLE Users ADD COLUMN AvatarUrl TEXT NULL;",
            "ALTER TABLE Users ADD COLUMN IsEmailConfirmed INTEGER NOT NULL DEFAULT 0;",
            "ALTER TABLE Users ADD COLUMN EmailConfirmationToken TEXT NULL;",
            "ALTER TABLE Users ADD COLUMN EmailConfirmationTokenExpiresUtc TEXT NULL;",
            "ALTER TABLE Users ADD COLUMN PasswordResetToken TEXT NULL;",
            "ALTER TABLE Users ADD COLUMN PasswordResetTokenExpiresUtc TEXT NULL;"
        };

        foreach (var sql in columns)
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(sql);
            }
            catch
            {
                // Column already exists or provider does not support raw alter; ignore safely
            }
        }
    }

    private static async Task EnsureOrderColumnsExistAsync(SocialCommerceDbContext context)
    {
        var columns = new[]
        {
            "ALTER TABLE Orders ADD COLUMN PaymentMethod TEXT NULL;",
            "ALTER TABLE Orders ADD COLUMN PaymentReference TEXT NULL;",
            "ALTER TABLE Orders ADD COLUMN PaymentInstructions TEXT NULL;",
            "ALTER TABLE Orders ADD COLUMN PaymentExpiresAtUtc TEXT NULL;",
            "ALTER TABLE Orders ADD COLUMN SenderWalletOrReference TEXT NULL;",
            "ALTER TABLE Orders ADD COLUMN ShippingFee REAL NOT NULL DEFAULT 0;",
            "ALTER TABLE Orders ADD COLUMN DistanceKm REAL NOT NULL DEFAULT 0;",
            "ALTER TABLE Orders ADD COLUMN EstimatedDeliveryMinutes INTEGER NOT NULL DEFAULT 0;",
            "ALTER TABLE Orders ADD COLUMN DeliveryLatitude REAL NULL;",
            "ALTER TABLE Orders ADD COLUMN DeliveryLongitude REAL NULL;",
            "ALTER TABLE Orders ADD COLUMN CustomerPhone TEXT NULL;",
            "ALTER TABLE Orders ADD COLUMN BuildingDetails TEXT NULL;",
            "ALTER TABLE Orders ADD COLUMN PromoCode TEXT NULL;",
            "ALTER TABLE Orders ADD COLUMN DiscountAmount REAL NOT NULL DEFAULT 0;",
            "ALTER TABLE Orders ADD COLUMN IsPhoneVerified INTEGER NOT NULL DEFAULT 0;"
        };

        foreach (var sql in columns)
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(sql);
            }
            catch
            {
                // Column already exists or provider does not support raw alter; ignore safely
            }
        }
    }

    private static async Task EnsureMerchantColumnsExistAsync(SocialCommerceDbContext context)
    {
        var columns = new[]
        {
            "ALTER TABLE Merchants ADD COLUMN Latitude REAL NOT NULL DEFAULT 30.0626;",
            "ALTER TABLE Merchants ADD COLUMN Longitude REAL NOT NULL DEFAULT 31.2223;",
            "ALTER TABLE Merchants ADD COLUMN Address TEXT NULL DEFAULT 'Zamalek, Cairo';",
            "ALTER TABLE Merchants ADD COLUMN City TEXT NULL DEFAULT 'Cairo';",
            "ALTER TABLE Merchants ADD COLUMN Tagline TEXT NULL DEFAULT '';",
            "ALTER TABLE Merchants ADD COLUMN Bio TEXT NULL DEFAULT '';",
            "ALTER TABLE Merchants ADD COLUMN AvatarUrl TEXT NULL DEFAULT '';",
            "ALTER TABLE Merchants ADD COLUMN BannerUrl TEXT NULL DEFAULT '';",
            "ALTER TABLE Merchants ADD COLUMN Phone TEXT NULL DEFAULT '';"
        };

        foreach (var sql in columns)
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(sql);
            }
            catch
            {
                // Column already exists or provider does not support raw alter; ignore safely
            }
        }
    }

    private static async Task EnsureDataSanityAsync(SocialCommerceDbContext context)
    {
        var repairs = new[]
        {
            "UPDATE Orders SET CustomerEmail = 'customer@example.com' WHERE CustomerEmail = 'youssef@example.com';",
            "UPDATE Orders SET PaymentMethod = 'PayPal' WHERE PaymentMethod IS NULL OR PaymentMethod = '';",
            "UPDATE Orders SET ShippingFee = 0 WHERE ShippingFee IS NULL;",
            "UPDATE Orders SET DistanceKm = 0 WHERE DistanceKm IS NULL;",
            "UPDATE Orders SET EstimatedDeliveryMinutes = 0 WHERE EstimatedDeliveryMinutes IS NULL;",
            "UPDATE Orders SET DiscountAmount = 0 WHERE DiscountAmount IS NULL;",
            "UPDATE Orders SET IsPhoneVerified = 0 WHERE IsPhoneVerified IS NULL;",
            "UPDATE Merchants SET Tagline = '' WHERE Tagline IS NULL;",
            "UPDATE Merchants SET Bio = '' WHERE Bio IS NULL;",
            "UPDATE Merchants SET AvatarUrl = '' WHERE AvatarUrl IS NULL;",
            "UPDATE Merchants SET BannerUrl = '' WHERE BannerUrl IS NULL;",
            "UPDATE Merchants SET Phone = '' WHERE Phone IS NULL;",
            "UPDATE Merchants SET Address = 'Zamalek, Cairo' WHERE Address IS NULL;",
            "UPDATE Merchants SET City = 'Cairo' WHERE City IS NULL;"
        };

        foreach (var sql in repairs)
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(sql);
            }
            catch
            {
                // Ignore safely if table or column doesn't exist yet
            }
        }
    }
}

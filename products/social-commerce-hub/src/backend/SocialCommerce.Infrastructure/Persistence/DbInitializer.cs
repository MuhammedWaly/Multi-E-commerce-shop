using Microsoft.EntityFrameworkCore;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Services;

namespace SocialCommerce.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(SocialCommerceDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

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
            var customerUser = new User("customer@example.com", customerHash, customerSalt, "Youssef El-Gohary", UserRole.Customer);

            var sariHash = hasher.HashPassword("Password123!", out var sariSalt);
            var sariUser = new User("sari@example.com", sariHash, sariSalt, "Sari Boutique Owner", UserRole.Merchant, sariMerchant?.Id);

            var cairoHash = hasher.HashPassword("Password123!", out var cairoSalt);
            var cairoUser = new User("craft@example.com", cairoHash, cairoSalt, "Cairo Leather Maker", UserRole.Merchant, cairoLeather?.Id);

            var adminHash = hasher.HashPassword("Password123!", out var adminSalt);
            var adminUser = new User("admin@socialhub.eg", adminHash, adminSalt, "Platform Administrator", UserRole.Admin);

            context.Users.AddRange(customerUser, sariUser, cairoUser, adminUser);
            await context.SaveChangesAsync();
        }
    }
}

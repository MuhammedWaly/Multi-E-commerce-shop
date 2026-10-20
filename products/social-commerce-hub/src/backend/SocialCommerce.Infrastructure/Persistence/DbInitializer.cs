using Microsoft.EntityFrameworkCore;
using SocialCommerce.Domain.Entities;

namespace SocialCommerce.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(SocialCommerceDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Merchants.AnyAsync())
        {
            return; // DB already seeded
        }

        var sariMerchant = new Merchant("Sari Boutique", "sari-boutique", "sari@example.com");
        var cairoLeather = new Merchant("Cairo Leather Craft", "cairo-leather", "craft@example.com");

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
}

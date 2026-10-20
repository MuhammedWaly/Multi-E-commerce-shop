using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Domain.Entities;

namespace SocialCommerce.Infrastructure.Services;

public class InMemoryCatalogService : ICatalogService
{
    private readonly List<Merchant> _merchants = new();
    private readonly List<Product> _products = new();

    public InMemoryCatalogService()
    {
        // Seed initial demo data for immediate feed testing
        var sariMerchant = new Merchant("Sari Boutique", "sari-boutique", "sari@example.com");
        var cairoLeather = new Merchant("Cairo Leather Craft", "cairo-leather", "craft@example.com");
        _merchants.Add(sariMerchant);
        _merchants.Add(cairoLeather);

        _products.Add(new Product(sariMerchant.Id, "Oversized Beige Linen Shirt", 650m, "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800", false, 15));
        _products.Add(new Product(sariMerchant.Id, "Summer Silk Scarf", 320m, "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800", false, 25));
        _products.Add(new Product(cairoLeather.Id, "Handmade Genuine Leather Bag", 1250m, "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800", false, 8));
        _products.Add(new Product(cairoLeather.Id, "Classic Leather Cardholder", 280m, "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800", false, 30));
    }

    public Task<IReadOnlyList<FeedItemDto>> GetFeedAsync(int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        var feedItems = _products
            .OrderByDescending(p => p.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p =>
            {
                var merchant = _merchants.FirstOrDefault(m => m.Id == p.MerchantId);
                return new FeedItemDto(
                    p.Id,
                    p.MerchantId,
                    merchant?.StoreName ?? "Independent Merchant",
                    merchant?.Slug ?? "store",
                    p.Title,
                    p.Price,
                    p.MediaUrl,
                    p.IsVideo,
                    4.9, // Verified rating stub
                    p.StockQuantity
                );
            })
            .ToList();

        return Task.FromResult<IReadOnlyList<FeedItemDto>>(feedItems);
    }

    public Task<MerchantDto> CreateMerchantAsync(CreateMerchantRequest request, CancellationToken ct = default)
    {
        var merchant = new Merchant(request.StoreName, request.Slug, request.Email);
        _merchants.Add(merchant);

        return Task.FromResult(new MerchantDto(
            merchant.Id,
            merchant.StoreName,
            merchant.Slug,
            merchant.Email,
            merchant.Balance,
            merchant.IsActive,
            merchant.CreatedAtUtc
        ));
    }

    public Task<MerchantDetailsDto?> GetMerchantBySlugAsync(string slug, CancellationToken ct = default)
    {
        var merchant = _merchants.FirstOrDefault(m => m.Slug.Equals(slug, StringComparison.OrdinalIgnoreCase));
        if (merchant == null)
            return Task.FromResult<MerchantDetailsDto?>(null);

        var merchantProducts = _products
            .Where(p => p.MerchantId == merchant.Id)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new ProductDto(
                p.Id,
                p.MerchantId,
                p.Title,
                p.Price,
                p.MediaUrl,
                p.IsVideo,
                p.StockQuantity,
                p.CreatedAtUtc
            ))
            .ToList();

        return Task.FromResult<MerchantDetailsDto?>(new MerchantDetailsDto(
            merchant.Id,
            merchant.StoreName,
            merchant.Slug,
            merchant.Email,
            merchant.Balance,
            merchant.IsActive,
            merchant.CreatedAtUtc,
            merchantProducts
        ));
    }

    public Task<ProductDto> AddProductAsync(Guid merchantId, AddProductRequest request, CancellationToken ct = default)
    {
        var merchant = _merchants.FirstOrDefault(m => m.Id == merchantId);
        if (merchant == null)
            throw new ArgumentException("Merchant not found.", nameof(merchantId));

        var product = new Product(merchantId, request.Title, request.Price, request.MediaUrl, request.IsVideo, request.StockQuantity);
        _products.Add(product);

        return Task.FromResult(new ProductDto(
            product.Id,
            product.MerchantId,
            product.Title,
            product.Price,
            product.MediaUrl,
            product.IsVideo,
            product.StockQuantity,
            product.CreatedAtUtc
        ));
    }
}

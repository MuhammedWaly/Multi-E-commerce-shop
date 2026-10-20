using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;

namespace SocialCommerce.Infrastructure.Services;

public class CatalogService : ICatalogService
{
    private readonly SocialCommerceDbContext _db;

    public CatalogService(SocialCommerceDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<FeedItemDto>> GetFeedAsync(int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        var query = from p in _db.Products.AsNoTracking()
                    join m in _db.Merchants.AsNoTracking() on p.MerchantId equals m.Id
                    orderby p.CreatedAtUtc descending
                    select new FeedItemDto(
                        p.Id,
                        p.MerchantId,
                        m.StoreName,
                        m.Slug,
                        p.Title,
                        p.Price,
                        p.MediaUrl,
                        p.IsVideo,
                        4.9,
                        p.StockQuantity
                    );

        return await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<MerchantDto> CreateMerchantAsync(CreateMerchantRequest request, CancellationToken ct = default)
    {
        var existing = await _db.Merchants.AnyAsync(m => m.Slug == request.Slug.ToLowerInvariant(), ct);
        if (existing)
        {
            throw new ArgumentException($"Merchant slug '{request.Slug}' is already taken.");
        }

        var merchant = new Merchant(request.StoreName, request.Slug, request.Email);
        _db.Merchants.Add(merchant);
        await _db.SaveChangesAsync(ct);

        return new MerchantDto(
            merchant.Id,
            merchant.StoreName,
            merchant.Slug,
            merchant.Email,
            merchant.Balance,
            merchant.IsActive,
            merchant.CreatedAtUtc
        );
    }

    public async Task<MerchantDetailsDto?> GetMerchantBySlugAsync(string slug, CancellationToken ct = default)
    {
        var merchant = await _db.Merchants
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Slug == slug.ToLowerInvariant(), ct);

        if (merchant == null)
            return null;

        var products = await _db.Products
            .AsNoTracking()
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
            .ToListAsync(ct);

        return new MerchantDetailsDto(
            merchant.Id,
            merchant.StoreName,
            merchant.Slug,
            merchant.Email,
            merchant.Balance,
            merchant.IsActive,
            merchant.CreatedAtUtc,
            products
        );
    }

    public async Task<ProductDto> AddProductAsync(Guid merchantId, AddProductRequest request, CancellationToken ct = default)
    {
        var merchantExists = await _db.Merchants.AnyAsync(m => m.Id == merchantId, ct);
        if (!merchantExists)
        {
            throw new ArgumentException("Merchant not found.", nameof(merchantId));
        }

        var product = new Product(merchantId, request.Title, request.Price, request.MediaUrl, request.IsVideo, request.StockQuantity);
        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);

        return new ProductDto(
            product.Id,
            product.MerchantId,
            product.Title,
            product.Price,
            product.MediaUrl,
            product.IsVideo,
            product.StockQuantity,
            product.CreatedAtUtc
        );
    }
}

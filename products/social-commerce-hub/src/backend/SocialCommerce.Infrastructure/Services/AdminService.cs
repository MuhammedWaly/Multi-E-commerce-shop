using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;

namespace SocialCommerce.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly SocialCommerceDbContext _db;

    public AdminService(SocialCommerceDbContext db)
    {
        _db = db;
    }

    public async Task<PlatformOverviewDto> GetOverviewAsync(CancellationToken ct = default)
    {
        var totalUsers = await _db.Users.CountAsync(ct);
        var totalBuyers = await _db.Users.CountAsync(u => u.Role == UserRole.Customer || u.Role == UserRole.Buyer, ct);
        var totalMerchants = await _db.Merchants.CountAsync(ct);
        var totalProducts = await _db.Products.CountAsync(ct);
        var totalOrders = await _db.Orders.CountAsync(ct);

        var settledOrders = await _db.Orders
            .Where(o => o.Status == OrderStatus.Paid || o.Status == OrderStatus.Fulfilled)
            .ToListAsync(ct);

        var totalGrossSales = settledOrders.Sum(o => o.TotalAmount);
        var totalPlatformRevenue = settledOrders.Sum(o => o.PlatformFeeAmount);
        var totalMerchantDisbursements = settledOrders.Sum(o => o.MerchantNetAmount);

        return new PlatformOverviewDto(
            totalUsers,
            totalBuyers,
            totalMerchants,
            totalProducts,
            totalOrders,
            totalGrossSales,
            totalPlatformRevenue,
            totalMerchantDisbursements
        );
    }

    public async Task<IReadOnlyList<AdminMerchantDto>> GetAllMerchantsAsync(CancellationToken ct = default)
    {
        var merchants = await _db.Merchants
            .AsNoTracking()
            .ToListAsync(ct);

        var products = await _db.Products
            .AsNoTracking()
            .ToListAsync(ct);

        var orders = await _db.Orders
            .AsNoTracking()
            .ToListAsync(ct);

        var result = new List<AdminMerchantDto>();

        foreach (var m in merchants)
        {
            var storeProducts = products.Where(p => p.MerchantId == m.Id).ToList();
            var storeOrders = orders.Where(o => o.MerchantId == m.Id && (o.Status == OrderStatus.Paid || o.Status == OrderStatus.Fulfilled)).ToList();

            result.Add(new AdminMerchantDto(
                m.Id,
                m.StoreName,
                m.Slug,
                m.Email,
                m.IsActive,
                storeProducts.Count,
                storeOrders.Count,
                storeOrders.Sum(o => o.TotalAmount),
                m.CreatedAtUtc
            ));
        }

        return result;
    }

    public async Task<IReadOnlyList<AdminUserDto>> GetAllUsersAsync(CancellationToken ct = default)
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAtUtc)
            .ToListAsync(ct);

        var merchants = await _db.Merchants
            .AsNoTracking()
            .ToDictionaryAsync(m => m.Id, m => m.Slug, ct);

        return users.Select(u => new AdminUserDto(
            u.Id,
            u.Email,
            u.FullName,
            u.Role.ToString(),
            u.MerchantId,
            u.MerchantId.HasValue && merchants.TryGetValue(u.MerchantId.Value, out var slug) ? slug : null,
            u.CreatedAtUtc
        )).ToList();
    }

    public async Task<IReadOnlyList<AdminOrderDto>> GetAllOrdersAsync(CancellationToken ct = default)
    {
        var orders = await _db.Orders
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync(ct);

        var merchants = await _db.Merchants
            .AsNoTracking()
            .ToDictionaryAsync(m => m.Id, m => m.StoreName, ct);

        return orders.Select(o => new AdminOrderDto(
            o.Id,
            o.MerchantId,
            merchants.TryGetValue(o.MerchantId, out var storeName) ? storeName : "Unknown Store",
            o.CustomerName,
            o.CustomerEmail,
            o.ShippingAddress,
            o.TotalAmount,
            o.PlatformFeeAmount,
            o.MerchantNetAmount,
            o.Status.ToString(),
            o.CreatedAtUtc
        )).ToList();
    }

    public async Task<bool> UpdateMerchantStatusAsync(Guid merchantId, bool isActive, CancellationToken ct = default)
    {
        var merchant = await _db.Merchants.FirstOrDefaultAsync(m => m.Id == merchantId, ct);
        if (merchant == null) return false;

        merchant.SetActive(isActive);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteMerchantAsync(Guid merchantId, CancellationToken ct = default)
    {
        var merchant = await _db.Merchants.FirstOrDefaultAsync(m => m.Id == merchantId, ct);
        if (merchant == null) return false;

        // Clean up products listed under this merchant
        var products = await _db.Products.Where(p => p.MerchantId == merchantId).ToListAsync(ct);
        if (products.Count > 0)
        {
            _db.Products.RemoveRange(products);
        }

        // Unlink any merchant users
        var users = await _db.Users.Where(u => u.MerchantId == merchantId).ToListAsync(ct);
        foreach (var u in users)
        {
            u.UnlinkMerchant();
        }

        _db.Merchants.Remove(merchant);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteProductAsync(Guid productId, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product == null) return false;

        _db.Products.Remove(product);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}

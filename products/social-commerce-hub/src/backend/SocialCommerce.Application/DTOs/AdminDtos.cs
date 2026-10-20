namespace SocialCommerce.Application.DTOs;

public record PlatformOverviewDto(
    int TotalUsersCount,
    int TotalBuyersCount,
    int TotalMerchantsCount,
    int TotalProductsCount,
    int TotalOrdersCount,
    decimal TotalGrossSales,
    decimal TotalPlatformRevenue,
    decimal TotalMerchantDisbursements
);

public record AdminMerchantDto(
    Guid Id,
    string StoreName,
    string Slug,
    string OwnerEmail,
    bool IsActive,
    int ProductsCount,
    int OrdersCount,
    decimal TotalSales,
    DateTime CreatedAtUtc
);

public record AdminUserDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    Guid? MerchantId,
    string? StoreSlug,
    DateTime CreatedAtUtc
);

public record AdminOrderDto(
    Guid Id,
    Guid MerchantId,
    string StoreName,
    string CustomerName,
    string CustomerEmail,
    string ShippingAddress,
    decimal TotalAmount,
    decimal PlatformFeeAmount,
    decimal MerchantNetAmount,
    string Status,
    DateTime CreatedAtUtc
);

public record UpdateMerchantStatusRequest(
    bool IsActive
);

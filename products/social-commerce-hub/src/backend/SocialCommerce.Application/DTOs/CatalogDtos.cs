namespace SocialCommerce.Application.DTOs;

public record FeedItemDto(
    Guid Id,
    Guid MerchantId,
    string StoreName,
    string StoreSlug,
    string Title,
    decimal Price,
    string MediaUrl,
    bool IsVideo,
    double Rating,
    int StockQuantity
);

public record CreateMerchantRequest(
    string StoreName,
    string Slug,
    string Email
);

public record MerchantDto(
    Guid Id,
    string StoreName,
    string Slug,
    string Email,
    decimal Balance,
    bool IsActive,
    DateTime CreatedAtUtc
);

public record AddProductRequest(
    string Title,
    decimal Price,
    string MediaUrl,
    bool IsVideo,
    int StockQuantity
);

public record UpdateProductRequest(
    string Title,
    decimal Price,
    string MediaUrl,
    bool IsVideo,
    int StockQuantity
);

public record SearchResultItemDto(
    Guid Id,
    string Type, // "Product" or "Merchant"
    string Title,
    string Subtitle,
    string SlugOrUrl,
    decimal? Price,
    string MediaUrl,
    bool IsVideo,
    int MatchScore
);

public record SearchResponseDto(
    string Query,
    bool IsFuzzyMatch,
    string? SuggestedQuery,
    IReadOnlyList<SearchResultItemDto> Products,
    IReadOnlyList<SearchResultItemDto> Merchants
);

public record ProductDto(
    Guid Id,
    Guid MerchantId,
    string Title,
    decimal Price,
    string MediaUrl,
    bool IsVideo,
    int StockQuantity,
    DateTime CreatedAtUtc
);

public record MerchantDetailsDto(
    Guid Id,
    string StoreName,
    string Slug,
    string Email,
    decimal Balance,
    bool IsActive,
    DateTime CreatedAtUtc,
    IReadOnlyList<ProductDto> Products
);

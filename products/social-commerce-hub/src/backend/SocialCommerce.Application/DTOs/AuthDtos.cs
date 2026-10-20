namespace SocialCommerce.Application.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string Role = "Customer",
    string? StoreName = null,
    string? StoreSlug = null
);

public record LoginRequest(
    string Email,
    string Password
);

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    Guid? MerchantId,
    string? StoreSlug,
    bool IsEmailConfirmed = false
);

public record AuthResponseDto(
    string Token,
    UserDto User
);

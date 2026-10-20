namespace SocialCommerce.Application.DTOs;

public record UserProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string? PhoneNumber,
    string? AvatarUrl,
    string Role,
    Guid? MerchantId,
    string? StoreSlug,
    bool IsEmailConfirmed,
    DateTime CreatedAtUtc
);

public record UpdateProfileRequest(
    string FullName,
    string? PhoneNumber = null,
    string? AvatarUrl = null
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);

public record ForgotPasswordRequest(
    string Email
);

public record ResetPasswordRequest(
    string Email,
    string ResetToken,
    string NewPassword
);

public record ConfirmEmailRequest(
    string Email,
    string Token
);

public record ResendConfirmationRequest(
    string Email
);

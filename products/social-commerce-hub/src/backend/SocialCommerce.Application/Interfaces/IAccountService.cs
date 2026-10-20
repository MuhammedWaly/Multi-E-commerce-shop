using SocialCommerce.Application.DTOs;

namespace SocialCommerce.Application.Interfaces;

public interface IAccountService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct = default);
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
    Task<bool> ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken ct = default);
    Task<bool> ResendConfirmationEmailAsync(ResendConfirmationRequest request, CancellationToken ct = default);
}

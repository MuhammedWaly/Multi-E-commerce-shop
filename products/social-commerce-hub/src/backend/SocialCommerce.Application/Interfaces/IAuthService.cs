using SocialCommerce.Application.DTOs;

namespace SocialCommerce.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthResponseDto> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken ct = default);
}

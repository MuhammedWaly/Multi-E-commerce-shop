using SocialCommerce.Domain.Entities;

namespace SocialCommerce.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user, string? merchantSlug = null);
}

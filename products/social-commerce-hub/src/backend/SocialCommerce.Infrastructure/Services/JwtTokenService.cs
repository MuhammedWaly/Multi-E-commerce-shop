using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Domain.Entities;

namespace SocialCommerce.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public const string DefaultSecret = "SocialCommerce_Super_Secure_Secret_Key_For_Jwt_Auth_2026_Minimum256BitsRequired!";
    public const string DefaultIssuer = "SocialCommerce";
    public const string DefaultAudience = "SocialCommerceClient";

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(User user, string? merchantSlug = null)
    {
        var secret = _config["Jwt:Secret"] ?? DefaultSecret;
        var issuer = _config["Jwt:Issuer"] ?? DefaultIssuer;
        var audience = _config["Jwt:Audience"] ?? DefaultAudience;
        var expiryHours = int.TryParse(_config["Jwt:ExpiryHours"], out var hours) ? hours : 24;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role.ToString()),
        };

        if (user.MerchantId.HasValue)
        {
            claims.Add(new Claim("merchantId", user.MerchantId.Value.ToString()));
            if (!string.IsNullOrWhiteSpace(merchantSlug))
            {
                claims.Add(new Claim("storeSlug", merchantSlug));
            }
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(expiryHours),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}

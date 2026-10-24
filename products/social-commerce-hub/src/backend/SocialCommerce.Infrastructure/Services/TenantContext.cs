using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Infrastructure.Services;

/// <summary>
/// Scoped container holding the tenant information for the active HTTP or worker request.
/// </summary>
public class TenantContext : ITenantContext
{
    public Guid? TenantId { get; private set; }
    public string? TenantSlug { get; private set; }
    public string? TenantName { get; private set; }
    public bool HasTenant => TenantId.HasValue;

    public void SetTenant(Guid tenantId, string? slug = null, string? name = null)
    {
        TenantId = tenantId;
        TenantSlug = slug;
        TenantName = name;
    }
}

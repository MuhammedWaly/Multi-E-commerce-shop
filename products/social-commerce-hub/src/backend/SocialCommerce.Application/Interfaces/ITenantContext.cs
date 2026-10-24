namespace SocialCommerce.Application.Interfaces;

/// <summary>
/// Represents the resolved tenant context for the current request execution.
/// Supports multi-tenancy for store isolation and white-label merchant instances.
/// </summary>
public interface ITenantContext
{
    Guid? TenantId { get; }
    string? TenantSlug { get; }
    string? TenantName { get; }
    bool HasTenant { get; }
    void SetTenant(Guid tenantId, string? slug = null, string? name = null);
}

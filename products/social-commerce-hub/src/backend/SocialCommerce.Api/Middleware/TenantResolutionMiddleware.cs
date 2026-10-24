using System.Security.Claims;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace SocialCommerce.Api.Middleware;

/// <summary>
/// Resolves tenant context from request headers (X-Tenant-Id, X-Tenant-Slug),
/// query strings (?tenant=slug), or JWT user claims for authenticated merchants.
/// Enables multi-tenancy and data isolation across stores.
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext, SocialCommerceDbContext dbContext)
    {
        Guid? resolvedTenantId = null;
        string? resolvedSlug = null;
        string? resolvedName = null;

        // 1. Check HTTP Headers: X-Tenant-Id or X-Tenant-Slug
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader) &&
            Guid.TryParse(tenantHeader.ToString(), out var parsedHeaderId))
        {
            resolvedTenantId = parsedHeaderId;
        }
        else if (context.Request.Headers.TryGetValue("X-Tenant-Slug", out var slugHeader) &&
                 !string.IsNullOrWhiteSpace(slugHeader))
        {
            resolvedSlug = slugHeader.ToString().Trim();
        }

        // 2. Check Query Parameters: ?tenant=slug_or_id
        if (!resolvedTenantId.HasValue && string.IsNullOrEmpty(resolvedSlug) &&
            context.Request.Query.TryGetValue("tenant", out var tenantQuery) &&
            !string.IsNullOrWhiteSpace(tenantQuery))
        {
            var queryVal = tenantQuery.ToString().Trim();
            if (Guid.TryParse(queryVal, out var queryId))
            {
                resolvedTenantId = queryId;
            }
            else
            {
                resolvedSlug = queryVal;
            }
        }

        // 3. Check Authenticated Merchant Claim
        if (!resolvedTenantId.HasValue && context.User.Identity?.IsAuthenticated == true)
        {
            var merchantClaim = context.User.FindFirst("merchant_id")?.Value
                                ?? context.User.FindFirst("MerchantId")?.Value;

            if (!string.IsNullOrEmpty(merchantClaim) && Guid.TryParse(merchantClaim, out var claimId))
            {
                resolvedTenantId = claimId;
            }
        }

        // 4. Resolve slug to ID or ID to slug if DB lookup is needed
        if (resolvedTenantId.HasValue && string.IsNullOrEmpty(resolvedSlug))
        {
            var merchant = await dbContext.Merchants
                .AsNoTracking()
                .Where(m => m.Id == resolvedTenantId.Value)
                .Select(m => new { m.Id, m.Slug, m.StoreName })
                .FirstOrDefaultAsync();

            if (merchant != null)
            {
                resolvedSlug = merchant.Slug;
                resolvedName = merchant.StoreName;
            }
        }
        else if (!resolvedTenantId.HasValue && !string.IsNullOrEmpty(resolvedSlug))
        {
            var merchant = await dbContext.Merchants
                .AsNoTracking()
                .Where(m => m.Slug == resolvedSlug)
                .Select(m => new { m.Id, m.Slug, m.StoreName })
                .FirstOrDefaultAsync();

            if (merchant != null)
            {
                resolvedTenantId = merchant.Id;
                resolvedName = merchant.StoreName;
            }
        }

        // 5. Populate Scoped Tenant Context
        if (resolvedTenantId.HasValue)
        {
            tenantContext.SetTenant(resolvedTenantId.Value, resolvedSlug, resolvedName);
            context.Response.Headers.Append("X-Tenant-Context", resolvedSlug ?? resolvedTenantId.Value.ToString());
        }
        else
        {
            context.Response.Headers.Append("X-Tenant-Context", "marketplace-global");
        }

        await _next(context);
    }
}

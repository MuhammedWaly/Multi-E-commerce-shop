using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Api.Controllers;

[Route("api/[controller]")]
public class MerchantsController : BaseApiController
{
    private readonly ICatalogService _catalogService;
    private readonly IOrderService _orderService;

    public MerchantsController(ICatalogService catalogService, IOrderService orderService)
    {
        _catalogService = catalogService;
        _orderService = orderService;
    }

    private bool IsAuthorizedForMerchant(Guid merchantId)
    {
        // Strictly Merchant role only: Only the store owner assigned to this merchantId is authorized
        if (!User.IsInRole("Merchant")) return false;

        var userMerchantIdStr = User.FindFirst("merchantId")?.Value;
        if (Guid.TryParse(userMerchantIdStr, out var userMerchantId) && userMerchantId == merchantId)
        {
            return true;
        }

        return false;
    }

    /// <summary>
    /// Registers a new merchant storefront
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<MerchantDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<MerchantDto>>> CreateMerchant(
        [FromBody] CreateMerchantRequest request,
        CancellationToken ct = default)
    {
        var merchant = await _catalogService.CreateMerchantAsync(request, ct);
        return CreatedSuccess($"/api/merchants/{merchant.Slug}", merchant, "Merchant store registered successfully.");
    }

    /// <summary>
    /// Retrieves storefront profile and products by slug (Public)
    /// </summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(ApiResponse<MerchantDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<MerchantDetailsDto>>> GetMerchantBySlug(
        string slug,
        CancellationToken ct = default)
    {
        var merchant = await _catalogService.GetMerchantBySlugAsync(slug, ct);
        if (merchant == null)
        {
            return Failed<MerchantDetailsDto>($"Merchant store '{slug}' not found.", "Store not found.", StatusCodes.Status404NotFound);
        }

        return Success(merchant, "Merchant storefront retrieved successfully.");
    }

    /// <summary>
    /// Adds and publishes a new product under the merchant storefront (Merchant Store Owner Only)
    /// </summary>
    [Authorize(Roles = "Merchant")]
    [HttpPost("{merchantId:guid}/products")]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<ProductDto>>> AddProduct(
        Guid merchantId,
        [FromBody] AddProductRequest request,
        CancellationToken ct = default)
    {
        if (!IsAuthorizedForMerchant(merchantId))
        {
            return Failed<ProductDto>("Access denied. Only the store owner can publish products for this storefront.", "Forbidden", StatusCodes.Status403Forbidden);
        }

        var product = await _catalogService.AddProductAsync(merchantId, request, ct);
        return CreatedSuccess($"/api/products/{product.Id}", product, "Product published successfully to storefront.");
    }

    /// <summary>
    /// Retrieves all customer orders placed for this merchant (Merchant Store Owner Only)
    /// </summary>
    [Authorize(Roles = "Merchant")]
    [HttpGet("{merchantId:guid}/orders")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<OrderDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderDto>>>> GetMerchantOrders(
        Guid merchantId,
        CancellationToken ct = default)
    {
        if (!IsAuthorizedForMerchant(merchantId))
        {
            return Failed<IReadOnlyList<OrderDto>>("Access denied. Only the store owner can view customer orders for this storefront.", "Forbidden", StatusCodes.Status403Forbidden);
        }

        var orders = await _orderService.GetMerchantOrdersAsync(merchantId, ct);
        return Success(orders, "Merchant orders retrieved successfully.");
    }

    /// <summary>
    /// Retrieves aggregate merchant dashboard KPIs, financial totals, and recent orders (Merchant Store Owner Only)
    /// </summary>
    [Authorize(Roles = "Merchant")]
    [HttpGet("{merchantId:guid}/dashboard")]
    [ProducesResponseType(typeof(ApiResponse<MerchantDashboardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<MerchantDashboardDto>>> GetMerchantDashboard(
        Guid merchantId,
        CancellationToken ct = default)
    {
        if (!IsAuthorizedForMerchant(merchantId))
        {
            return Failed<MerchantDashboardDto>("Access denied. Only the store owner can access financial analytics for this storefront.", "Forbidden", StatusCodes.Status403Forbidden);
        }

        var dashboard = await _orderService.GetMerchantDashboardAsync(merchantId, ct);
        if (dashboard == null)
        {
            return Failed<MerchantDashboardDto>("Merchant account not found.", "Not found.", StatusCodes.Status404NotFound);
        }

        return Success(dashboard, "Merchant dashboard data retrieved successfully.");
    }

    /// <summary>
    /// Retrieves audited financial ledger entries for merchant disbursements and fee deductions (Merchant Store Owner Only)
    /// </summary>
    [Authorize(Roles = "Merchant")]
    [HttpGet("{merchantId:guid}/ledger")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MerchantLedgerEntryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MerchantLedgerEntryDto>>>> GetMerchantLedger(
        Guid merchantId,
        CancellationToken ct = default)
    {
        if (!IsAuthorizedForMerchant(merchantId))
        {
            return Failed<IReadOnlyList<MerchantLedgerEntryDto>>("Access denied. You cannot view the financial ledger of another merchant store.", "Forbidden", StatusCodes.Status403Forbidden);
        }

        var ledger = await _orderService.GetMerchantLedgerAsync(merchantId, ct);
        return Success(ledger, "Merchant financial ledger retrieved successfully.");
    }
}

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
    /// Retrieves storefront profile and products by slug
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
    /// Adds and publishes a new product under the merchant storefront
    /// </summary>
    [HttpPost("{merchantId:guid}/products")]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<ProductDto>>> AddProduct(
        Guid merchantId,
        [FromBody] AddProductRequest request,
        CancellationToken ct = default)
    {
        var product = await _catalogService.AddProductAsync(merchantId, request, ct);
        return CreatedSuccess($"/api/products/{product.Id}", product, "Product published successfully to storefront.");
    }

    /// <summary>
    /// Retrieves all customer orders placed for this merchant
    /// </summary>
    [HttpGet("{merchantId:guid}/orders")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderDto>>>> GetMerchantOrders(
        Guid merchantId,
        CancellationToken ct = default)
    {
        var orders = await _orderService.GetMerchantOrdersAsync(merchantId, ct);
        return Success(orders, "Merchant orders retrieved successfully.");
    }

    /// <summary>
    /// Retrieves aggregate merchant dashboard KPIs, financial totals, and recent orders
    /// </summary>
    [HttpGet("{merchantId:guid}/dashboard")]
    [ProducesResponseType(typeof(ApiResponse<MerchantDashboardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<MerchantDashboardDto>>> GetMerchantDashboard(
        Guid merchantId,
        CancellationToken ct = default)
    {
        var dashboard = await _orderService.GetMerchantDashboardAsync(merchantId, ct);
        if (dashboard == null)
        {
            return Failed<MerchantDashboardDto>("Merchant account not found.", "Not found.", StatusCodes.Status404NotFound);
        }

        return Success(dashboard, "Merchant dashboard data retrieved successfully.");
    }

    /// <summary>
    /// Retrieves audited financial ledger entries for merchant disbursements and fee deductions
    /// </summary>
    [HttpGet("{merchantId:guid}/ledger")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MerchantLedgerEntryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MerchantLedgerEntryDto>>>> GetMerchantLedger(
        Guid merchantId,
        CancellationToken ct = default)
    {
        var ledger = await _orderService.GetMerchantLedgerAsync(merchantId, ct);
        return Success(ledger, "Merchant financial ledger retrieved successfully.");
    }
}

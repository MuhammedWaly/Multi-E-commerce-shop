using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Api.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class AdminController : BaseApiController
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    /// <summary>
    /// Retrieves aggregate platform metrics, GMV, user counts, and 5% fee revenue
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(ApiResponse<PlatformOverviewDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PlatformOverviewDto>>> GetOverview(CancellationToken ct = default)
    {
        var overview = await _adminService.GetOverviewAsync(ct);
        return Success(overview, "Platform overview metrics retrieved successfully.");
    }

    /// <summary>
    /// Retrieves all registered merchants and their operational statuses
    /// </summary>
    [HttpGet("merchants")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AdminMerchantDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminMerchantDto>>>> GetAllMerchants(CancellationToken ct = default)
    {
        var merchants = await _adminService.GetAllMerchantsAsync(ct);
        return Success(merchants, "Platform merchants list retrieved successfully.");
    }

    /// <summary>
    /// Toggles merchant store operational status (Active / Suspended)
    /// </summary>
    [HttpPatch("merchants/{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateMerchantStatus(
        Guid id,
        [FromBody] UpdateMerchantStatusRequest request,
        CancellationToken ct = default)
    {
        var success = await _adminService.UpdateMerchantStatusAsync(id, request.IsActive, ct);
        if (!success)
        {
            return Failed<bool>($"Merchant '{id}' not found.", "Store not found.", StatusCodes.Status404NotFound);
        }

        return Success(true, $"Merchant store status updated to {(request.IsActive ? "Active" : "Suspended")}.");
    }

    /// <summary>
    /// Deletes a merchant store and cleans up its listings (Admin governance)
    /// </summary>
    [HttpDelete("merchants/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteMerchant(
        Guid id,
        CancellationToken ct = default)
    {
        var success = await _adminService.DeleteMerchantAsync(id, ct);
        if (!success)
        {
            return Failed<bool>($"Merchant '{id}' not found.", "Store not found.", StatusCodes.Status404NotFound);
        }

        return Success(true, "Merchant store and its listings were permanently removed.");
    }

    /// <summary>
    /// Retrieves all platform user accounts and their assigned roles
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AdminUserDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminUserDto>>>> GetAllUsers(CancellationToken ct = default)
    {
        var users = await _adminService.GetAllUsersAsync(ct);
        return Success(users, "Platform user accounts directory retrieved successfully.");
    }

    /// <summary>
    /// Retrieves all platform orders across all merchants
    /// </summary>
    [HttpGet("orders")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AdminOrderDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminOrderDto>>>> GetAllOrders(CancellationToken ct = default)
    {
        var orders = await _adminService.GetAllOrdersAsync(ct);
        return Success(orders, "All platform customer orders retrieved successfully.");
    }

    /// <summary>
    /// Moderates and removes a violating product listing from any storefront
    /// </summary>
    [HttpDelete("products/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteProduct(Guid id, CancellationToken ct = default)
    {
        var success = await _adminService.DeleteProductAsync(id, ct);
        if (!success)
        {
            return Failed<bool>($"Product '{id}' not found.", "Product not found.", StatusCodes.Status404NotFound);
        }

        return Success(true, "Product listing moderated and removed from platform.");
    }
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Api.Controllers;

[Route("api/[controller]")]
public class OrdersController : BaseApiController
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Creates and initiates a customer checkout order with inventory reservation
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrder(
        [FromBody] CreateOrderRequest request,
        CancellationToken ct = default)
    {
        var order = await _orderService.CreateOrderAsync(request, ct);
        return CreatedSuccess($"/api/orders/{order.Id}", order, "Order placed successfully.");
    }

    /// <summary>
    /// Retrieves order history for the currently authenticated buyer
    /// </summary>
    [Authorize]
    [HttpGet("my-orders")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderDto>>>> GetMyOrders(CancellationToken ct = default)
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email))
        {
            return Success<IReadOnlyList<OrderDto>>(Array.Empty<OrderDto>(), "No customer account identified.");
        }

        var orders = await _orderService.GetCustomerOrdersAsync(email, ct);
        return Success(orders, "Customer orders retrieved successfully.");
    }

    /// <summary>
    /// Retrieves order details by order ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetOrderById(
        Guid id,
        CancellationToken ct = default)
    {
        var order = await _orderService.GetOrderByIdAsync(id, ct);
        if (order == null)
        {
            return Failed<OrderDto>($"Order with ID '{id}' was not found.", "Order not found.", StatusCodes.Status404NotFound);
        }

        return Success(order, "Order details retrieved successfully.");
    }

    /// <summary>
    /// Captures payment authorization and fulfills order
    /// </summary>
    [HttpPost("{id:guid}/capture")]
    [ProducesResponseType(typeof(ApiResponse<CaptureOrderResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<CaptureOrderResult>>> CaptureOrder(
        Guid id,
        [FromBody] CaptureOrderRequest request,
        CancellationToken ct = default)
    {
        var result = await _orderService.CaptureOrderAsync(id, request, ct);
        if (!result.IsSuccess)
        {
            return Failed<CaptureOrderResult>(result.ErrorMessage ?? "Payment capture failed.", "Capture payment failed.", StatusCodes.Status400BadRequest);
        }

        return Success(result, "Order payment captured successfully.");
    }

    /// <summary>
    /// Simulates payment settlement for Fawry bill references or kiosk terminals
    /// </summary>
    [HttpPost("{id:guid}/fawry/settle")]
    [ProducesResponseType(typeof(ApiResponse<CaptureOrderResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CaptureOrderResult>>> SettleFawryOrder(
        Guid id,
        [FromBody] SettleFawryOrderRequest? request = null,
        CancellationToken ct = default)
    {
        var order = await _orderService.GetOrderByIdAsync(id, ct);
        if (order == null)
        {
            return Failed<CaptureOrderResult>($"Order with ID '{id}' was not found.", "Order not found.", StatusCodes.Status404NotFound);
        }

        var billReference = !string.IsNullOrWhiteSpace(request?.ReferenceNumber)
            ? request.ReferenceNumber
            : order.PaymentOrderId ?? string.Empty;

        var payerId = !string.IsNullOrWhiteSpace(request?.KioskTerminalId)
            ? request.KioskTerminalId
            : "FAWRY-KIOSK-SIMULATOR";

        var captureReq = new CaptureOrderRequest(billReference, payerId, request?.ReferenceNumber);
        var result = await _orderService.CaptureOrderAsync(id, captureReq, ct);

        if (!result.IsSuccess)
        {
            return Failed<CaptureOrderResult>(result.ErrorMessage ?? "Fawry settlement failed.", "Fawry settlement failed.", StatusCodes.Status400BadRequest);
        }

        return Success(result, "Fawry order settled successfully.");
    }

    /// <summary>
    /// Updates operational fulfillment status of an order (Protected: merchant tenant isolated)
    /// </summary>
    [Authorize(Roles = "Merchant,Admin")]
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateOrderStatus(
        Guid id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken ct = default)
    {
        var existingOrder = await _orderService.GetOrderByIdAsync(id, ct);
        if (existingOrder == null)
        {
            return Failed<OrderDto>($"Order with ID '{id}' was not found.", "Order not found.", StatusCodes.Status404NotFound);
        }

        if (!User.IsInRole("Merchant"))
        {
            return Failed<OrderDto>("Access denied. Only the store merchant can update order fulfillment status.", "Forbidden", StatusCodes.Status403Forbidden);
        }

        var userMerchantIdStr = User.FindFirst("merchantId")?.Value;
        if (!Guid.TryParse(userMerchantIdStr, out var userMerchantId) || userMerchantId != existingOrder.MerchantId)
        {
            return Failed<OrderDto>("Access denied. You cannot update fulfillment status for orders belonging to another merchant.", "Forbidden", StatusCodes.Status403Forbidden);
        }

        var order = await _orderService.UpdateOrderStatusAsync(id, request.Status, ct);
        return Success(order, "Order status updated successfully.");
    }
}

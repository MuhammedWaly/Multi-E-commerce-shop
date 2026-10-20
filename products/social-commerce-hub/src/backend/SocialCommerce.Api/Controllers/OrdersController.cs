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
    /// Updates operational fulfillment status of an order
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateOrderStatus(
        Guid id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken ct = default)
    {
        var order = await _orderService.UpdateOrderStatusAsync(id, request.Status, ct);
        return Success(order, "Order status updated successfully.");
    }
}

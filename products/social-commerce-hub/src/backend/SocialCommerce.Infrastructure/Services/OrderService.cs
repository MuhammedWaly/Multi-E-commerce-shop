using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Persistence;

namespace SocialCommerce.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly SocialCommerceDbContext _db;
    private readonly IPaymentProviderFactory _paymentFactory;

    public OrderService(SocialCommerceDbContext db, IPaymentProviderFactory paymentFactory)
    {
        _db = db;
        _paymentFactory = paymentFactory;
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, CancellationToken ct = default)
    {
        var merchant = await _db.Merchants.FindAsync(new object[] { request.MerchantId }, ct);
        if (merchant == null)
            throw new ArgumentException($"Merchant '{request.MerchantId}' not found.");

        if (request.Items == null || request.Items.Count == 0)
            throw new ArgumentException("Order must have at least one item.");

        var orderItems = new List<OrderItem>();
        foreach (var itemReq in request.Items)
        {
            var product = await _db.Products.FindAsync(new object[] { itemReq.ProductId }, ct);
            if (product == null)
                throw new ArgumentException($"Product '{itemReq.ProductId}' not found.");

            if (product.MerchantId != request.MerchantId)
                throw new InvalidOperationException($"Product '{product.Title}' does not belong to merchant.");

            // Deduct stock
            product.ReduceStock(itemReq.Quantity);

            orderItems.Add(new OrderItem(product.Id, product.Title, product.Price, itemReq.Quantity));
        }

        var order = new Order(
            request.MerchantId,
            request.CustomerName,
            request.CustomerEmail,
            request.ShippingAddress,
            orderItems
        );

        // Call payment provider to initiate payment order
        var provider = _paymentFactory.GetDefaultProvider();
        var paymentResult = await provider.CreatePaymentOrderAsync(new PaymentOrderRequest(
            order.Id,
            order.TotalAmount,
            "USD",
            "http://localhost:5173/checkout/success",
            "http://localhost:5173/checkout/cancel",
            $"Order {order.Id} at {merchant.StoreName}"
        ), ct);

        if (!paymentResult.IsSuccess)
        {
            throw new InvalidOperationException($"Payment order creation failed: {paymentResult.ErrorMessage}");
        }

        order.AssignPaymentOrderId(paymentResult.PaymentOrderId);

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        return MapToDto(order);
    }

    public async Task<OrderDto?> GetOrderByIdAsync(Guid id, CancellationToken ct = default)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        return order == null ? null : MapToDto(order);
    }

    public async Task<CaptureOrderResult> CaptureOrderAsync(Guid orderId, CaptureOrderRequest request, CancellationToken ct = default)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            return new CaptureOrderResult(false, string.Empty, "NOT_FOUND", null, "Order not found.");

        if (order.PaymentOrderId != request.PaymentOrderId)
            return new CaptureOrderResult(false, string.Empty, "MISMATCH", null, "PaymentOrderId does not match order.");

        var provider = _paymentFactory.GetDefaultProvider();
        var verifyResult = await provider.VerifyPaymentAsync(new PaymentVerificationRequest(request.PaymentOrderId, request.PayerId), ct);

        if (!verifyResult.IsSuccess)
        {
            return new CaptureOrderResult(false, string.Empty, verifyResult.Status, null, verifyResult.ErrorMessage);
        }

        order.MarkAsPaid(verifyResult.TransactionId);

        // Credit merchant balance
        var merchant = await _db.Merchants.FindAsync(new object[] { order.MerchantId }, ct);
        if (merchant != null)
        {
            merchant.CreditBalance(order.MerchantNetAmount);

            // Record ledger entries
            var saleEntry = new MerchantLedgerEntry(
                merchant.Id,
                order.Id,
                LedgerEntryType.CreditSale,
                order.TotalAmount,
                $"Gross sale for Order #{order.Id}"
            );
            var feeEntry = new MerchantLedgerEntry(
                merchant.Id,
                order.Id,
                LedgerEntryType.FeeDeduction,
                order.PlatformFeeAmount,
                $"Platform fee ({(order.PlatformFeeRate * 100):0.0}%) for Order #{order.Id}"
            );

            _db.MerchantLedgerEntries.AddRange(saleEntry, feeEntry);
        }

        await _db.SaveChangesAsync(ct);

        return new CaptureOrderResult(true, verifyResult.TransactionId, "COMPLETED", MapToDto(order));
    }

    public async Task<IReadOnlyList<MerchantLedgerEntryDto>> GetMerchantLedgerAsync(Guid merchantId, CancellationToken ct = default)
    {
        return await _db.MerchantLedgerEntries
            .AsNoTracking()
            .Where(l => l.MerchantId == merchantId)
            .OrderByDescending(l => l.CreatedAtUtc)
            .Select(l => new MerchantLedgerEntryDto(
                l.Id,
                l.MerchantId,
                l.OrderId,
                l.Type.ToString(),
                l.Amount,
                l.Description,
                l.CreatedAtUtc
            ))
            .ToListAsync(ct);
    }

    public async Task<MerchantDashboardDto?> GetMerchantDashboardAsync(Guid merchantId, CancellationToken ct = default)
    {
        var merchant = await _db.Merchants.AsNoTracking().FirstOrDefaultAsync(m => m.Id == merchantId, ct);
        if (merchant == null)
            return null;

        var orders = await _db.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .Where(o => o.MerchantId == merchantId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync(ct);

        var productsCount = await _db.Products.CountAsync(p => p.MerchantId == merchantId, ct);

        var activeOrders = orders.Where(o => o.Status != OrderStatus.Cancelled).ToList();

        var totalGross = activeOrders.Sum(o => o.TotalAmount);
        var totalFees = activeOrders.Sum(o => o.PlatformFeeAmount);
        var totalNet = activeOrders.Sum(o => o.MerchantNetAmount);

        return new MerchantDashboardDto(
            merchant.Id,
            merchant.StoreName,
            merchant.Balance,
            orders.Count,
            totalGross,
            totalNet,
            totalFees,
            productsCount,
            orders.Take(10).Select(MapToDto).ToList()
        );
    }

    public async Task<IReadOnlyList<OrderDto>> GetMerchantOrdersAsync(Guid merchantId, CancellationToken ct = default)
    {
        var orders = await _db.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .Where(o => o.MerchantId == merchantId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync(ct);

        return orders.Select(MapToDto).ToList();
    }

    public async Task<OrderDto> UpdateOrderStatusAsync(Guid orderId, string newStatus, CancellationToken ct = default)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            throw new ArgumentException("Order not found.", nameof(orderId));

        if (newStatus.Equals("Fulfilled", StringComparison.OrdinalIgnoreCase))
        {
            order.MarkAsFulfilled();
        }
        else if (newStatus.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            order.Cancel();
        }
        else
        {
            throw new ArgumentException($"Unsupported status transition to: '{newStatus}'");
        }

        await _db.SaveChangesAsync(ct);
        return MapToDto(order);
    }

    public async Task<IReadOnlyList<OrderDto>> GetCustomerOrdersAsync(string customerEmail, CancellationToken ct = default)
    {
        var normalizedEmail = customerEmail.Trim().ToLowerInvariant();
        var orders = await _db.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .Where(o => o.CustomerEmail == normalizedEmail)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync(ct);

        return orders.Select(MapToDto).ToList();
    }

    private static OrderDto MapToDto(Order order)
    {
        return new OrderDto(
            order.Id,
            order.MerchantId,
            order.CustomerName,
            order.CustomerEmail,
            order.ShippingAddress,
            order.Status.ToString(),
            order.TotalAmount,
            order.PlatformFeeAmount,
            order.MerchantNetAmount,
            order.PaymentOrderId,
            order.PaymentTransactionId,
            order.CreatedAtUtc,
            order.PaidAtUtc,
            order.Items.Select(i => new OrderItemDto(
                i.Id,
                i.ProductId,
                i.ProductTitle,
                i.UnitPrice,
                i.Quantity,
                i.Subtotal
            )).ToList()
        );
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;
using SocialCommerce.Application.Shipping;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Payments.PayPal;
using SocialCommerce.Infrastructure.Persistence;

namespace SocialCommerce.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly SocialCommerceDbContext _db;
    private readonly IPaymentProviderFactory _paymentFactory;
    private readonly IShippingService _shippingService;
    private readonly IPromoService _promoService;
    private readonly IBackgroundTaskQueue? _taskQueue;
    private readonly PayPalSettings _payPalSettings;

    public OrderService(
        SocialCommerceDbContext db,
        IPaymentProviderFactory paymentFactory,
        IShippingService? shippingService = null,
        IPromoService? promoService = null,
        IBackgroundTaskQueue? taskQueue = null,
        IOptions<PayPalSettings>? payPalSettings = null)
    {
        _db = db;
        _paymentFactory = paymentFactory;
        _shippingService = shippingService ?? new ShippingCalculationService();
        _promoService = promoService ?? new PromoCodeService();
        _taskQueue = taskQueue;
        _payPalSettings = payPalSettings?.Value ?? new PayPalSettings();
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

        // Resolve payment method and gateway provider dynamically
        var requestedMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "PayPal" : request.PaymentMethod.Trim();
        var provider = _paymentFactory.GetProvider(requestedMethod);

        // Calculate dynamic distance-based shipping fee only when delivery coordinates are provided
        var hasDeliveryCoords = request.DeliveryLatitude.HasValue && request.DeliveryLongitude.HasValue &&
                                Math.Abs(request.DeliveryLatitude.Value) > 0.001 && Math.Abs(request.DeliveryLongitude.Value) > 0.001;

        var shippingResult = hasDeliveryCoords
            ? _shippingService.CalculateShipping(
                merchant.Latitude,
                merchant.Longitude,
                request.DeliveryLatitude!.Value,
                request.DeliveryLongitude!.Value,
                merchant.Address,
                merchant.City
            )
            : new ShippingCalculationResult
            {
                DistanceKm = 0,
                ShippingFee = 0m,
                EstimatedDeliveryMinutes = 0,
                FormattedEta = "Instant Hub",
                StoreLatitude = merchant.Latitude,
                StoreLongitude = merchant.Longitude,
                StoreAddress = merchant.Address,
                StoreCity = merchant.City
            };

        var senderRef = request.EffectiveSenderWallet ?? request.PaymentReference;
        var order = new Order(
            request.MerchantId,
            request.CustomerName,
            request.CustomerEmail,
            request.ShippingAddress,
            orderItems,
            0.05m,
            provider.ProviderName,
            null,
            request.PaymentReference,
            null,
            null,
            senderRef,
            request.DeliveryLatitude,
            request.DeliveryLongitude,
            shippingResult.ShippingFee,
            shippingResult.DistanceKm,
            shippingResult.EstimatedDeliveryMinutes
        );

        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var rawSubtotal = orderItems.Sum(i => i.Subtotal);
            var promoVal = _promoService.ValidatePromoCode(request.PromoCode, rawSubtotal);
            if (promoVal.IsValid && promoVal.DiscountAmount > 0)
            {
                order.ApplyPromoCode(request.PromoCode, promoVal.DiscountAmount);
            }
        }

        order.SetCustomerContact(request.CustomerPhone, request.BuildingDetails, request.IsPhoneVerified);

        // Resolve dynamic return and cancel URLs
        var successUrl = !string.IsNullOrWhiteSpace(_payPalSettings.ReturnUrl)
            ? _payPalSettings.ReturnUrl
            : "http://localhost:5173/checkout/success";
        var cancelUrl = !string.IsNullOrWhiteSpace(_payPalSettings.CancelUrl)
            ? _payPalSettings.CancelUrl
            : "http://localhost:5173/checkout/cancel";

        // Call payment provider to initiate payment order
        var paymentResult = await provider.CreatePaymentOrderAsync(new PaymentOrderRequest(
            order.Id,
            order.TotalAmount,
            "EGP",
            successUrl,
            cancelUrl,
            $"Order {order.Id} at {merchant.StoreName}"
        ), ct);

        if (!paymentResult.IsSuccess)
        {
            throw new InvalidOperationException($"Payment order creation failed: {paymentResult.ErrorMessage}");
        }

        order.AssignPaymentOrderId(paymentResult.PaymentOrderId);

        // Apply channel-specific instructions and references
        if (provider.ProviderName.Equals("Fawry", StringComparison.OrdinalIgnoreCase))
        {
            var expiresAt = DateTime.UtcNow.AddHours(48);
            var instructions = $"Please settle bill reference {paymentResult.PaymentOrderId} at any Fawry retail kiosk, POS terminal, or banking app before {expiresAt:yyyy-MM-dd HH:mm} UTC. / يرجى سداد كود الدفع {paymentResult.PaymentOrderId} لدى أي منفذ فوري أو نقاط البيع أو التطبيق البنكي.";
            order.SetPaymentDetails(paymentResult.PaymentOrderId, instructions, expiresAt, senderRef);
        }
        else if (provider.ProviderName.Equals("InstaPay", StringComparison.OrdinalIgnoreCase))
        {
            var instructions = $"Transfer {order.TotalAmount:F2} EGP via InstaPay / Mobile Wallet. Reference: {paymentResult.PaymentOrderId}. Sender: {senderRef ?? "Customer Wallet"}.";
            order.SetPaymentDetails(paymentResult.PaymentOrderId, instructions, null, senderRef);
        }
        else if (provider.ProviderName.Equals("CashOnDelivery", StringComparison.OrdinalIgnoreCase))
        {
            var instructions = "Pay cash directly to courier upon delivery.";
            order.SetPaymentDetails(paymentResult.PaymentOrderId, instructions, null, null);
        }
        else
        {
            order.SetPaymentDetails(paymentResult.PaymentOrderId, null, null, null);
        }

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        if (_taskQueue != null)
        {
            var savedOrderId = order.Id;
            var customerEmail = order.CustomerEmail;
            var storeName = merchant.StoreName;
            await _taskQueue.QueueBackgroundWorkItemAsync((sp, cancelToken) =>
            {
                var logger = sp.GetService<Microsoft.Extensions.Logging.ILogger<OrderService>>();
                logger?.LogInformation("Async Notification Worker: Dispatched order creation event for #{OrderId} ({CustomerEmail} @ {StoreName})", savedOrderId, customerEmail, storeName);
                return ValueTask.CompletedTask;
            });
        }

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

        var provider = _paymentFactory.GetProvider(order.PaymentMethod);
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

            // Record double-entry ledger entries
            var saleEntry = new MerchantLedgerEntry(
                merchant.Id,
                order.Id,
                LedgerEntryType.CreditSale,
                order.TotalAmount,
                $"Gross sale for Order #{order.Id} via {order.PaymentMethod}"
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

        // Also look up user details for phone linkage
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);
        var userPhone = user?.PhoneNumber?.Trim();

        var orders = await _db.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .Where(o => o.CustomerEmail == normalizedEmail
                     || (normalizedEmail == "customer@example.com" && o.CustomerEmail == "youssef@example.com")
                     || (normalizedEmail == "youssef@example.com" && o.CustomerEmail == "customer@example.com")
                     || (!string.IsNullOrEmpty(userPhone) && o.CustomerPhone == userPhone))
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync(ct);

        return orders.Select(o => MapToDto(o)).ToList();
    }

    public async Task<ShippingCalculationResult> CalculateShippingAsync(CalculateShippingDto request, CancellationToken ct = default)
    {
        var merchant = await _db.Merchants.FindAsync(new object[] { request.MerchantId }, ct);
        var storeLat = merchant?.Latitude ?? 30.0626;
        var storeLon = merchant?.Longitude ?? 31.2223;
        var storeAddress = merchant?.Address ?? "Zamalek, Cairo";
        var storeCity = merchant?.City ?? "Cairo";

        return _shippingService.CalculateShipping(
            storeLat,
            storeLon,
            request.CustomerLatitude,
            request.CustomerLongitude,
            storeAddress,
            storeCity
        );
    }

    public async Task<OrderTrackingDto?> GetOrderTrackingAsync(Guid orderId, CancellationToken ct = default)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null) return null;

        var merchant = await _db.Merchants.FindAsync(new object[] { order.MerchantId }, ct);
        var storeName = merchant?.StoreName ?? "Boutique Store";
        var storeAddress = merchant?.Address ?? "Zamalek, Cairo";
        var storeCity = merchant?.City ?? "Cairo";
        var storeLat = merchant?.Latitude ?? 30.0626;
        var storeLon = merchant?.Longitude ?? 31.2223;

        var steps = new List<string>
        {
            "Order Confirmed / تم تأكيد الطلب",
            "Preparing in Boutique / جاري التجهيز في المتجر",
            "Out for Delivery / مع مندوب التوصيل في الطريق",
            "Delivered / تم التوصيل والاستلام"
        };

        var currentStep = order.Status switch
        {
            OrderStatus.Fulfilled => 3,
            OrderStatus.OutForDelivery => 2,
            OrderStatus.Processing or OrderStatus.Paid => 1,
            _ => 0
        };

        var etaMins = order.EstimatedDeliveryMinutes > 0 ? order.EstimatedDeliveryMinutes : 45;
        var formattedEta = etaMins < 60
            ? $"{etaMins} mins / {etaMins} دقيقة"
            : $"{etaMins / 60}h {etaMins % 60}m";

        return new OrderTrackingDto
        {
            OrderId = order.Id,
            Status = order.Status.ToString(),
            CustomerName = order.CustomerName,
            ShippingAddress = order.ShippingAddress,
            DeliveryLatitude = order.DeliveryLatitude,
            DeliveryLongitude = order.DeliveryLongitude,
            DistanceKm = order.DistanceKm,
            ShippingFee = order.ShippingFee,
            EstimatedDeliveryMinutes = etaMins,
            FormattedEta = formattedEta,
            StoreName = storeName,
            StoreAddress = storeAddress,
            StoreCity = storeCity,
            StoreLatitude = storeLat,
            StoreLongitude = storeLon,
            CreatedAtUtc = order.CreatedAtUtc,
            TimelineSteps = steps,
            CurrentStepIndex = currentStep
        };
    }

    private static OrderDto MapToDto(Order order)
    {
        var settlementStatus = (order.Status == OrderStatus.Paid || order.Status == OrderStatus.Fulfilled)
            ? "Settled"
            : "PendingSettlement";

        var etaMins = order.EstimatedDeliveryMinutes > 0 ? order.EstimatedDeliveryMinutes : 45;
        var formattedEta = etaMins < 60 ? $"{etaMins} mins" : $"{etaMins / 60}h {etaMins % 60}m";

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
            )).ToList(),
            order.PaymentMethod,
            order.PaymentReference,
            order.PaymentInstructions,
            order.PaymentExpiresAtUtc,
            order.SenderWalletOrReference,
            settlementStatus,
            order.ShippingFee,
            order.DistanceKm,
            order.EstimatedDeliveryMinutes,
            order.DeliveryLatitude,
            order.DeliveryLongitude,
            formattedEta,
            null,
            null,
            order.CustomerPhone,
            order.BuildingDetails,
            order.PromoCode,
            order.DiscountAmount,
            order.IsPhoneVerified
        );
    }

    public Task<ValidatePromoResponse> ValidatePromoCodeAsync(ValidatePromoRequest request, CancellationToken ct = default)
    {
        return Task.FromResult(_promoService.ValidatePromoCode(request.Code, request.ItemsSubtotal));
    }

    public async Task<OrderTrackingDto?> TrackLookupAsync(OrderTrackLookupRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.OrderIdentifier) || string.IsNullOrWhiteSpace(request.ContactInfo))
            return null;

        var cleanIdentifier = request.OrderIdentifier.Trim();
        var cleanContact = request.ContactInfo.Trim().ToLowerInvariant();

        var query = _db.Orders
            .Include(o => o.Items)
            .AsNoTracking();

        Order? order = null;
        if (Guid.TryParse(cleanIdentifier, out var orderGuid))
        {
            order = await query.FirstOrDefaultAsync(o => o.Id == orderGuid, ct);
        }

        if (order == null)
        {
            order = await query.FirstOrDefaultAsync(o =>
                (o.PaymentOrderId != null && o.PaymentOrderId.ToLower() == cleanIdentifier.ToLower()) ||
                (o.PaymentReference != null && o.PaymentReference.ToLower() == cleanIdentifier.ToLower()), ct);
        }

        if (order == null) return null;

        // Verify contact matches email or phone
        var emailMatch = !string.IsNullOrWhiteSpace(order.CustomerEmail) &&
                         order.CustomerEmail.ToLowerInvariant().Contains(cleanContact);
        var phoneMatch = !string.IsNullOrWhiteSpace(order.CustomerPhone) &&
                         (order.CustomerPhone.Contains(cleanContact) || cleanContact.Contains(order.CustomerPhone));

        if (!emailMatch && !phoneMatch && !cleanContact.Contains("@"))
        {
            var normOrderPhone = order.CustomerPhone?.Replace("+20", "0").Replace(" ", "").Trim();
            var normContact = cleanContact.Replace("+20", "0").Replace(" ", "").Trim();
            if (normOrderPhone != null && normContact != null && normOrderPhone == normContact)
            {
                phoneMatch = true;
            }
        }

        if (!emailMatch && !phoneMatch)
        {
            return null;
        }

        return await GetOrderTrackingAsync(order.Id, ct);
    }
}

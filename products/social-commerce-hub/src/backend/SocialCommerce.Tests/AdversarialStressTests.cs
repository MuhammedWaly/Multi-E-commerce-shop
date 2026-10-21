using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SocialCommerce.Api.Controllers;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;
using SocialCommerce.Domain.Entities;
using SocialCommerce.Infrastructure.Payments;
using SocialCommerce.Infrastructure.Payments.Egyptian;
using SocialCommerce.Infrastructure.Payments.PayPal;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class AdversarialStressTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly SocialCommerceDbContext _db;
    private readonly IPaymentProviderFactory _paymentFactory;
    private readonly OrderService _orderService;
    private readonly AdminService _adminService;

    public AdversarialStressTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<SocialCommerceDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new SocialCommerceDbContext(options);
        _db.Database.EnsureCreated();

        var providers = new IPaymentProvider[]
        {
            new PayPalPaymentProvider(),
            new CashOnDeliveryPaymentProvider(),
            new FawryPaymentProvider(),
            new InstaPayPaymentProvider()
        };

        _paymentFactory = new PaymentProviderFactory(providers);
        _orderService = new OrderService(_db, _paymentFactory);
        _adminService = new AdminService(_db);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private async Task<Merchant> SeedMerchantAsync(string name = "Adversarial Store")
    {
        var slug = name.ToLowerInvariant().Replace(" ", "-") + "-" + Guid.NewGuid().ToString("N")[..6];
        var merchant = new Merchant(name, slug, $"{slug}@adversarial.test");
        _db.Merchants.Add(merchant);
        await _db.SaveChangesAsync();
        return merchant;
    }

    private async Task<Product> SeedProductAsync(Guid merchantId, string title = "Test Item", decimal price = 100m, int stock = 1000)
    {
        var product = new Product(merchantId, title, price, "http://img.test/p.jpg", false, stock);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product;
    }

    // ====================================================================================================
    // STRESS TEST 1: CURRENCY PENNY ROUNDING & STRICT CONSERVATION ORACLE
    // ====================================================================================================

    [Theory]
    [InlineData(0.01, 0.00, 0.01)]
    [InlineData(0.03, 0.00, 0.03)]
    [InlineData(19.99, 1.00, 18.99)]
    [InlineData(99.95, 5.00, 94.95)]
    [InlineData(999.99, 50.00, 949.99)]
    [InlineData(1000000.00, 50000.00, 950000.00)]
    public void StressTest1_PennyConservation_UnusualTotals_ZeroDrift(decimal totalAmount, decimal expectedFee, decimal expectedNet)
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Sample Item", totalAmount, 1) };
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Cairo", items, 0.05m, "Fawry");

        Assert.Equal(totalAmount, order.TotalAmount);
        Assert.Equal(expectedFee, order.PlatformFeeAmount);
        Assert.Equal(expectedNet, order.MerchantNetAmount);

        // Strict conservation invariant: Total == Fee + Net with ZERO penny drift
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
        Assert.Equal(0.00m, order.TotalAmount - (order.PlatformFeeAmount + order.MerchantNetAmount));
    }

    [Fact]
    public void StressTest1_MonteCarlo_10000_RandomizedAmounts_StrictConservationOracle()
    {
        var random = new Random(42); // Deterministic seed for reproducible adversarial fuzzing
        int iterations = 10000;

        for (int i = 0; i < iterations; i++)
        {
            // Generate amounts across various scales: micro, low, medium, irregular, high
            decimal amount;
            var scaleCategory = i % 5;
            if (scaleCategory == 0)
            {
                // Micro amounts between 0.01 and 0.99
                amount = Math.Round((decimal)random.NextDouble(), 2);
                if (amount <= 0) amount = 0.01m;
            }
            else if (scaleCategory == 1)
            {
                // Prime and odd pennies between 1.01 and 99.99
                amount = Math.Round((decimal)(random.NextDouble() * 99 + 1), 2);
            }
            else if (scaleCategory == 2)
            {
                // Commercial order totals between 100.00 and 9,999.99
                amount = Math.Round((decimal)(random.NextDouble() * 9900 + 100), 2);
            }
            else if (scaleCategory == 3)
            {
                // High-value luxury orders between 10,000.00 and 1,000,000.00
                amount = Math.Round((decimal)(random.NextDouble() * 990000 + 10000), 2);
            }
            else
            {
                // Extreme corner cases: .05, .49, .99, .01, .95
                var fractionalPence = new[] { 0.01m, 0.03m, 0.05m, 0.15m, 0.25m, 0.33m, 0.49m, 0.50m, 0.75m, 0.95m, 0.99m };
                amount = random.Next(1, 10000) + fractionalPence[random.Next(fractionalPence.Length)];
            }

            var items = new List<OrderItem> { new(Guid.NewGuid(), $"Fuzz Item {i}", amount, 1) };
            var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Egypt", items, 0.05m, "InstaPay");

            // Assertions
            Assert.Equal(amount, order.TotalAmount);
            Assert.True(order.PlatformFeeAmount >= 0m, $"Fee cannot be negative for total {amount}");
            Assert.True(order.MerchantNetAmount >= 0m, $"Net cannot be negative for total {amount}");
            Assert.Equal(Math.Round(amount * 0.05m, 2), order.PlatformFeeAmount);
            Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
            Assert.Equal(0m, order.TotalAmount - (order.PlatformFeeAmount + order.MerchantNetAmount));
        }
    }

    [Fact]
    public void StressTest1_MultiItemOrder_50DistinctAwkwardItems_TotalFeeNetConservation()
    {
        var random = new Random(1337);
        var items = new List<OrderItem>();
        decimal manualSum = 0m;

        for (int i = 0; i < 50; i++)
        {
            var unitPrice = Math.Round((decimal)(random.NextDouble() * 49 + 1), 2);
            var qty = random.Next(1, 5);
            var item = new OrderItem(Guid.NewGuid(), $"Product {i}", unitPrice, qty);
            items.Add(item);
            manualSum += item.Subtotal;
        }

        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Egypt", items, 0.05m, "PayPal");

        Assert.Equal(manualSum, order.TotalAmount);
        Assert.Equal(order.TotalAmount, order.PlatformFeeAmount + order.MerchantNetAmount);
        Assert.Equal(Math.Round(manualSum * 0.05m, 2), order.PlatformFeeAmount);
        Assert.Equal(manualSum - order.PlatformFeeAmount, order.MerchantNetAmount);
    }

    // ====================================================================================================
    // STRESS TEST 2: REPLAY ATTACK VULNERABILITY TESTING
    // ====================================================================================================

    [Fact]
    public async Task StressTest2_Replay_DuplicateCaptureAcrossAllGateways_StrictlyRejected()
    {
        var merchant = await SeedMerchantAsync("Replay Resistance Store");
        var product = await SeedProductAsync(merchant.Id, "Protected Item", 500m, 100);

        var channels = new[] { "CashOnDelivery", "Fawry", "InstaPay", "PayPal" };

        foreach (var channel in channels)
        {
            var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
                merchant.Id, "Buyer", "b@test.com", "Cairo",
                new List<CreateOrderItemRequest> { new(product.Id, 1) },
                PaymentMethod: channel,
                SenderWalletOrReference: channel == "InstaPay" ? "01009988776" : null
            ));

            // Initial capture must succeed
            var firstCapture = await _orderService.CaptureOrderAsync(
                order.Id,
                new CaptureOrderRequest(order.PaymentOrderId!, "AUTH-KEY-1")
            );
            Assert.True(firstCapture.IsSuccess);
            Assert.Equal("Paid", firstCapture.Order!.Status);

            // Replay attempt must throw InvalidOperationException
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _orderService.CaptureOrderAsync(order.Id, new CaptureOrderRequest(order.PaymentOrderId!, "AUTH-KEY-2"))
            );
            Assert.Contains("Cannot pay order with current status: Paid", ex.Message);
        }

        // Verify merchant was credited exactly 4 * 475 = 1,900 EGP, NOT 3,800 EGP
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(1900m, updatedMerchant!.Balance);

        // Verify ledger has exactly 8 entries (4 sales + 4 fees), NOT 16
        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Equal(8, ledger.Count);
    }

    [Fact]
    public async Task StressTest2_Replay_DuplicateFawrySettlementWithForgedReference_Rejected()
    {
        var merchant = await SeedMerchantAsync("Fawry Anti-Replay Store");
        var product = await SeedProductAsync(merchant.Id, "Fawry Item", 800m, 20);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "Tamer", "tamer@fawry.test", "Alexandria",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "Fawry"
        ));

        // First settlement via Fawry kiosk simulator
        var cap1 = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest(order.PaymentOrderId!, "FAWRY-KIOSK-01")
        );
        Assert.True(cap1.IsSuccess);

        // Attempt replay with forged terminal ID and forged bill reference throws InvalidOperationException
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _orderService.CaptureOrderAsync(
                order.Id,
                new CaptureOrderRequest(order.PaymentOrderId!, "FAWRY-KIOSK-ATTACKER", "FORGED-TXN-999")
            )
        );
        Assert.Contains("Cannot pay order with current status: Paid", ex.Message);

        // Merchant net credit must stay exactly 760 EGP (not doubled to 1520)
        var updatedMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(760m, updatedMerchant!.Balance);
    }

    [Fact]
    public async Task StressTest2_Replay_MismatchedPaymentOrderId_StrictlyRejectedWithoutSideEffects()
    {
        var merchant = await SeedMerchantAsync("Tamper Proof Store");
        var product = await SeedProductAsync(merchant.Id, "Tamper Item", 600m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "Buyer", "buyer@tamper.test", "Giza",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "Fawry"
        ));

        // Attempt capture with spoofed payment order ID
        var captureResult = await _orderService.CaptureOrderAsync(
            order.Id,
            new CaptureOrderRequest("00000000", "ATTACKER-KIOSK")
        );

        Assert.False(captureResult.IsSuccess);
        Assert.Equal("MISMATCH", captureResult.Status);
        Assert.Equal("PaymentOrderId does not match order.", captureResult.ErrorMessage);

        // Order remains in AwaitingPayment
        var freshOrder = await _orderService.GetOrderByIdAsync(order.Id);
        Assert.Equal("AwaitingPayment", freshOrder!.Status);

        // Merchant balance untouched
        var freshMerchant = await _db.Merchants.FindAsync(merchant.Id);
        Assert.Equal(0m, freshMerchant!.Balance);

        // No ledger entries created
        var ledger = await _orderService.GetMerchantLedgerAsync(merchant.Id);
        Assert.Empty(ledger);
    }

    // ====================================================================================================
    // STRESS TEST 3: STATUS TRANSITION STATE MACHINE COMPREHENSIVE INVARIANT STRESS
    // ====================================================================================================

    [Theory]
    [InlineData("Fawry", OrderStatus.AwaitingPayment)]
    [InlineData("InstaPay", OrderStatus.Processing)]
    [InlineData("PayPal", OrderStatus.PendingPayment)]
    public void StressTest3_ForbiddenTransitions_UnpaidOrdersCannotBeFulfilled(string gateway, OrderStatus initialStatus)
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 350m, 1) };
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Cairo", items, 0.05m, gateway);

        Assert.Equal(initialStatus, order.Status);

        var ex = Assert.Throws<InvalidOperationException>(() => order.MarkAsFulfilled());
        Assert.Equal("Only paid orders can be fulfilled.", ex.Message);
    }

    [Fact]
    public void StressTest3_ForbiddenTransitions_CancelledOrderCannotBePaid()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 400m, 1) };
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Cairo", items, 0.05m, "Fawry");

        order.Cancel();
        Assert.Equal(OrderStatus.Cancelled, order.Status);

        var ex = Assert.Throws<InvalidOperationException>(() => order.MarkAsPaid("TXN-REVIVE"));
        Assert.Contains("Cannot pay order with current status: Cancelled", ex.Message);
    }

    [Fact]
    public void StressTest3_ForbiddenTransitions_FulfilledOrderCannotBeCancelledOrPaid()
    {
        var items = new List<OrderItem> { new(Guid.NewGuid(), "Item", 500m, 1) };
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Cairo", items, 0.05m, "CashOnDelivery");

        order.MarkAsFulfilled();
        Assert.Equal(OrderStatus.Fulfilled, order.Status);

        // Attempt cancel
        var cancelEx = Assert.Throws<InvalidOperationException>(() => order.Cancel());
        Assert.Equal("Fulfilled orders cannot be cancelled.", cancelEx.Message);

        // Attempt pay
        var payEx = Assert.Throws<InvalidOperationException>(() => order.MarkAsPaid("TXN-AFTER-FULFILL"));
        Assert.Contains("Cannot pay order with current status: Fulfilled", payEx.Message);

        // Attempt duplicate fulfill
        var fulfillEx = Assert.Throws<InvalidOperationException>(() => order.MarkAsFulfilled());
        Assert.Equal("Only paid orders can be fulfilled.", fulfillEx.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Delivered")]
    [InlineData("Refunded")]
    [InlineData("Dispatched")]
    [InlineData("Pending")]
    [InlineData("Paid")]
    [InlineData("' OR '1'='1")]
    public async Task StressTest3_UpdateOrderStatus_IllegalStatusStrings_StrictlyRejected(string illegalStatus)
    {
        var merchant = await SeedMerchantAsync("Status Guard Store");
        var product = await SeedProductAsync(merchant.Id, "Guarded Product", 200m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchant.Id, "Buyer", "buyer@guard.test", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "COD"
        ));

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _orderService.UpdateOrderStatusAsync(order.Id, illegalStatus)
        );

        Assert.Contains("Unsupported status transition to", ex.Message);
    }

    [Fact]
    public async Task StressTest3_StockBoundary_OrderingMoreThanStock_ThrowsAndAbortsOrder()
    {
        var merchant = await SeedMerchantAsync("Stock Guard Store");
        var product = await SeedProductAsync(merchant.Id, "Scarce Item", 100m, 5);

        // Order 6 items when only 5 exist
        var request = new CreateOrderRequest(
            merchant.Id, "Greedy Buyer", "buyer@greedy.test", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 6) },
            PaymentMethod: "COD"
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _orderService.CreateOrderAsync(request)
        );

        // Ensure stock remains intact at 5
        var freshProduct = await _db.Products.FindAsync(product.Id);
        Assert.Equal(5, freshProduct!.StockQuantity);

        // Ensure no ghost order was persisted
        var orders = await _db.Orders.Where(o => o.MerchantId == merchant.Id).ToListAsync();
        Assert.Empty(orders);
    }

    [Fact]
    public async Task StressTest3_StockBoundary_DrainingStockToZero_SucceedsExactly()
    {
        var merchant = await SeedMerchantAsync("Drain Stock Store");
        var product = await SeedProductAsync(merchant.Id, "Limited Item", 100m, 3);

        // Order exactly 3 items
        var request = new CreateOrderRequest(
            merchant.Id, "Buyer", "buyer@exact.test", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 3) },
            PaymentMethod: "COD"
        );

        var order = await _orderService.CreateOrderAsync(request);
        Assert.NotNull(order);

        // Stock must be exactly 0
        var freshProduct = await _db.Products.FindAsync(product.Id);
        Assert.Equal(0, freshProduct!.StockQuantity);

        // Subsequent order must fail due to zero stock
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _orderService.CreateOrderAsync(request)
        );
    }

    // ====================================================================================================
    // STRESS TEST 4: MULTI-MERCHANT CONCURRENCY & LEDGER ISOLATION
    // ====================================================================================================

    [Fact]
    public async Task StressTest4_MultiMerchant_CrossTenantProductPurchase_StrictlyRejected()
    {
        var merchantA = await SeedMerchantAsync("Merchant Alpha");
        var merchantB = await SeedMerchantAsync("Merchant Beta");

        var productA = await SeedProductAsync(merchantA.Id, "Alpha Product", 300m, 10);
        var productB = await SeedProductAsync(merchantB.Id, "Beta Product", 500m, 10);

        // Customer attempts to buy Merchant B's product under Merchant A's store order
        var maliciousRequest = new CreateOrderRequest(
            merchantA.Id, "Intruder", "intruder@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(productB.Id, 1) },
            PaymentMethod: "COD"
        );

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _orderService.CreateOrderAsync(maliciousRequest)
        );

        Assert.Contains("does not belong to merchant", ex.Message);
    }

    [Fact]
    public async Task StressTest4_MultiMerchant_ConcurrentSettlement_CompleteLedgerAndBalanceIsolation()
    {
        // Setup 5 distinct merchants
        var merchants = new List<Merchant>();
        var products = new List<Product>();

        for (int i = 0; i < 5; i++)
        {
            var m = await SeedMerchantAsync($"Concurrent Merchant {i + 1}");
            merchants.Add(m);
            var p = await SeedProductAsync(m.Id, $"Product {i + 1}", 100m * (i + 1), 100);
            products.Add(p);
        }

        // Each merchant gets 4 orders (1 COD, 1 Fawry, 1 InstaPay, 1 PayPal) = 20 total orders
        var gateways = new[] { "CashOnDelivery", "Fawry", "InstaPay", "PayPal" };
        var createdOrders = new List<(Merchant merchant, OrderDto order)>();

        for (int mIdx = 0; mIdx < 5; mIdx++)
        {
            var m = merchants[mIdx];
            var p = products[mIdx];

            foreach (var g in gateways)
            {
                var o = await _orderService.CreateOrderAsync(new CreateOrderRequest(
                    m.Id, $"Customer {mIdx}", $"c{mIdx}@concurrent.test", "Cairo",
                    new List<CreateOrderItemRequest> { new(p.Id, 1) },
                    PaymentMethod: g,
                    SenderWalletOrReference: g == "InstaPay" ? "01011223344" : null
                ));
                createdOrders.Add((m, o));
            }
        }

        Assert.Equal(20, createdOrders.Count);

        // Settle all 20 orders sequentially
        foreach (var item in createdOrders)
        {
            var capture = await _orderService.CaptureOrderAsync(
                item.order.Id,
                new CaptureOrderRequest(item.order.PaymentOrderId!, "SETTLED-AUTH")
            );
            Assert.True(capture.IsSuccess);
        }

        // Verify Strict Isolation for each of the 5 merchants
        decimal globalGross = 0m;
        decimal globalFees = 0m;
        decimal globalDisbursements = 0m;

        for (int mIdx = 0; mIdx < 5; mIdx++)
        {
            var m = merchants[mIdx];
            var p = products[mIdx];
            var unitPrice = 100m * (mIdx + 1);

            // 4 orders * unitPrice
            var expectedGross = unitPrice * 4;
            var expectedFee = Math.Round(expectedGross * 0.05m, 2);
            var expectedNet = expectedGross - expectedFee;

            var freshMerchant = await _db.Merchants.FindAsync(m.Id);
            Assert.NotNull(freshMerchant);
            Assert.Equal(expectedNet, freshMerchant.Balance);

            // Verify Merchant Dashboard isolation
            var dashboard = await _orderService.GetMerchantDashboardAsync(m.Id);
            Assert.NotNull(dashboard);
            Assert.Equal(4, dashboard.TotalOrdersCount);
            Assert.Equal(expectedGross, dashboard.TotalGrossSales);
            Assert.Equal(expectedNet, dashboard.TotalNetEarnings);
            Assert.Equal(expectedFee, dashboard.TotalPlatformFees);
            Assert.Equal(freshMerchant.Balance, dashboard.Balance);

            // Verify Merchant Ledger isolation
            var ledger = await _orderService.GetMerchantLedgerAsync(m.Id);
            Assert.Equal(8, ledger.Count); // 4 CreditSale + 4 FeeDeduction
            Assert.All(ledger, entry => Assert.Equal(m.Id, entry.MerchantId));

            var creditSum = ledger.Where(l => l.Type == "CreditSale").Sum(l => l.Amount);
            var feeSum = ledger.Where(l => l.Type == "FeeDeduction").Sum(l => l.Amount);

            Assert.Equal(expectedGross, creditSum);
            Assert.Equal(expectedFee, feeSum);
            Assert.Equal(freshMerchant.Balance, creditSum - feeSum);

            globalGross += expectedGross;
            globalFees += expectedFee;
            globalDisbursements += expectedNet;
        }

        // Global Conservation Check
        Assert.Equal(globalGross, globalFees + globalDisbursements);

        // Admin Overview Reconciliation Check
        var overview = await _adminService.GetOverviewAsync();
        Assert.Equal(globalGross, overview.TotalGrossSales);
        Assert.Equal(globalFees, overview.TotalPlatformRevenue);
        Assert.Equal(globalDisbursements, overview.TotalMerchantDisbursements);
        Assert.Equal(20, overview.TotalOrdersCount);
    }

    // ====================================================================================================
    // STRESS TEST 5: ADMIN GMV RECONCILIATION & UNSETTLED STRICT EXCLUSION
    // ====================================================================================================

    [Fact]
    public async Task StressTest5_AdminGMV_UnsettledAndCancelledOrders_StrictlyExcludedFromGMV()
    {
        var merchant = await SeedMerchantAsync("GMV Stress Store");
        var product = await SeedProductAsync(merchant.Id, "Expensive Luxury Goods", 1000m, 500);

        // Create 20 unsettled orders across each of the 4 payment channels (80 total)
        for (int i = 0; i < 20; i++)
        {
            await _orderService.CreateOrderAsync(new CreateOrderRequest(
                merchant.Id, $"Unsettled COD {i}", "c@gmv.test", "Cairo",
                new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "COD"
            ));

            await _orderService.CreateOrderAsync(new CreateOrderRequest(
                merchant.Id, $"Unsettled Fawry {i}", "f@gmv.test", "Cairo",
                new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
            ));

            await _orderService.CreateOrderAsync(new CreateOrderRequest(
                merchant.Id, $"Unsettled Insta {i}", "i@gmv.test", "Cairo",
                new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "InstaPay",
                SenderWalletOrReference: "01001234567"
            ));

            await _orderService.CreateOrderAsync(new CreateOrderRequest(
                merchant.Id, $"Unsettled PayPal {i}", "p@gmv.test", "Cairo",
                new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "PayPal"
            ));
        }

        // Create 10 cancelled orders
        for (int i = 0; i < 10; i++)
        {
            var cancelledOrder = await _orderService.CreateOrderAsync(new CreateOrderRequest(
                merchant.Id, $"Cancelled {i}", "cancel@gmv.test", "Cairo",
                new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "COD"
            ));
            await _orderService.UpdateOrderStatusAsync(cancelledOrder.Id, "Cancelled");
        }

        // Before any settlements: Total orders = 90, but GMV and Platform Revenue MUST BE EXACTLY 0.00
        var emptyOverview = await _adminService.GetOverviewAsync();
        Assert.Equal(90, emptyOverview.TotalOrdersCount);
        Assert.Equal(0.00m, emptyOverview.TotalGrossSales);
        Assert.Equal(0.00m, emptyOverview.TotalPlatformRevenue);
        Assert.Equal(0.00m, emptyOverview.TotalMerchantDisbursements);

        // Now create and settle 10 orders (5 Paid, 5 Fulfilled)
        for (int i = 0; i < 5; i++)
        {
            var o = await _orderService.CreateOrderAsync(new CreateOrderRequest(
                merchant.Id, $"Settled Paid {i}", "sp@gmv.test", "Cairo",
                new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "Fawry"
            ));
            await _orderService.CaptureOrderAsync(o.Id, new CaptureOrderRequest(o.PaymentOrderId!, "KIOSK-AUTH"));
        }

        for (int i = 0; i < 5; i++)
        {
            var o = await _orderService.CreateOrderAsync(new CreateOrderRequest(
                merchant.Id, $"Settled Fulfilled {i}", "sf@gmv.test", "Cairo",
                new List<CreateOrderItemRequest> { new(product.Id, 1) }, PaymentMethod: "COD"
            ));
            await _orderService.CaptureOrderAsync(o.Id, new CaptureOrderRequest(o.PaymentOrderId!, "COURIER-AUTH"));
            await _orderService.UpdateOrderStatusAsync(o.Id, "Fulfilled");
        }

        // Verify Admin Portal Overview
        var populatedOverview = await _adminService.GetOverviewAsync();

        // 90 previous + 10 new = 100 total orders
        Assert.Equal(100, populatedOverview.TotalOrdersCount);

        // Exactly 10 settled orders * 1,000.00 = 10,000.00 EGP GMV
        Assert.Equal(10000.00m, populatedOverview.TotalGrossSales);
        Assert.Equal(500.00m, populatedOverview.TotalPlatformRevenue);
        Assert.Equal(9500.00m, populatedOverview.TotalMerchantDisbursements);

        // Invariant: GMV == Revenue + Disbursements with ZERO drift
        Assert.Equal(populatedOverview.TotalGrossSales, populatedOverview.TotalPlatformRevenue + populatedOverview.TotalMerchantDisbursements);
    }

    // ====================================================================================================
    // STRESS TEST 6: CONTROLLER-LEVEL TENANT ISOLATION & DOMAIN BOUNDARY GUARDS
    // ====================================================================================================

    [Fact]
    public async Task StressTest6_Controller_CrossMerchantStatusUpdate_ReturnsForbidden()
    {
        var merchantAlpha = await SeedMerchantAsync("Merchant Alpha Store");
        var merchantBeta = await SeedMerchantAsync("Merchant Beta Store");
        var product = await SeedProductAsync(merchantAlpha.Id, "Alpha Special", 500m, 10);

        var order = await _orderService.CreateOrderAsync(new CreateOrderRequest(
            merchantAlpha.Id, "Buyer", "buyer@test.com", "Cairo",
            new List<CreateOrderItemRequest> { new(product.Id, 1) },
            PaymentMethod: "COD"
        ));

        // Create OrdersController instance
        var controller = new OrdersController(_orderService);

        // Impersonate Merchant Beta (intruder trying to update Merchant Alpha's order)
        var userClaims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "Merchant"),
            new Claim("merchantId", merchantBeta.Id.ToString())
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = userClaims }
        };

        var actionResult = await controller.UpdateOrderStatus(order.Id, new UpdateOrderStatusRequest("Fulfilled"));
        var objResult = Assert.IsType<ObjectResult>(actionResult.Result);

        Assert.Equal(StatusCodes.Status403Forbidden, objResult.StatusCode);
        var apiResponse = Assert.IsType<ApiResponse<OrderDto>>(objResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Contains("another merchant", apiResponse.Errors![0]);
    }

    [Fact]
    public async Task StressTest6_Controller_FawrySettle_NonExistentOrder_ReturnsNotFound()
    {
        var controller = new OrdersController(_orderService);
        var randomId = Guid.NewGuid();

        var result = await controller.SettleFawryOrder(randomId);
        var objResult = Assert.IsType<ObjectResult>(result.Result);

        Assert.Equal(StatusCodes.Status404NotFound, objResult.StatusCode);
        var apiResponse = Assert.IsType<ApiResponse<CaptureOrderResult>>(objResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Contains("not found", apiResponse.Errors![0], StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void StressTest6_MerchantDomain_CreditAndPayoutBoundaries()
    {
        var merchant = new Merchant("Financial Test Store", "fin-test", "fin@test.eg");
        Assert.Equal(0m, merchant.Balance);

        // Zero or negative credit throws ArgumentException
        Assert.Throws<ArgumentException>(() => merchant.CreditBalance(0m));
        Assert.Throws<ArgumentException>(() => merchant.CreditBalance(-100m));

        // Payout on zero balance throws InvalidOperationException
        Assert.Throws<InvalidOperationException>(() => merchant.PayoutBalance(50m));

        // Credit 1000 EGP
        merchant.CreditBalance(1000m);
        Assert.Equal(1000m, merchant.Balance);

        // Zero or negative payout throws ArgumentException
        Assert.Throws<ArgumentException>(() => merchant.PayoutBalance(0m));
        Assert.Throws<ArgumentException>(() => merchant.PayoutBalance(-10m));

        // Payout 1001 EGP (exceeds balance) throws InvalidOperationException
        Assert.Throws<InvalidOperationException>(() => merchant.PayoutBalance(1000.01m));

        // Valid payout of 750 EGP
        merchant.PayoutBalance(750m);
        Assert.Equal(250m, merchant.Balance);

        // Payout exact remainder (250 EGP) leaves balance at 0.00
        merchant.PayoutBalance(250m);
        Assert.Equal(0m, merchant.Balance);
    }

    [Fact]
    public void StressTest6_OrderDomain_InputValidationGuards()
    {
        var validItem = new OrderItem(Guid.NewGuid(), "Valid Item", 100m, 1);

        // Empty merchant
        Assert.Throws<ArgumentException>(() =>
            new Order(Guid.Empty, "Customer", "c@test.com", "Address", new[] { validItem }));

        // Empty customer name
        Assert.Throws<ArgumentException>(() =>
            new Order(Guid.NewGuid(), "", "c@test.com", "Address", new[] { validItem }));

        // Empty email
        Assert.Throws<ArgumentException>(() =>
            new Order(Guid.NewGuid(), "Customer", "   ", "Address", new[] { validItem }));

        // Empty shipping address
        Assert.Throws<ArgumentException>(() =>
            new Order(Guid.NewGuid(), "Customer", "c@test.com", "", new[] { validItem }));

        // Empty items list
        Assert.Throws<ArgumentException>(() =>
            new Order(Guid.NewGuid(), "Customer", "c@test.com", "Address", Enumerable.Empty<OrderItem>()));

        // Invalid fee rate < 0 or > 1
        Assert.Throws<ArgumentException>(() =>
            new Order(Guid.NewGuid(), "Customer", "c@test.com", "Address", new[] { validItem }, platformFeeRate: -0.01m));
        Assert.Throws<ArgumentException>(() =>
            new Order(Guid.NewGuid(), "Customer", "c@test.com", "Address", new[] { validItem }, platformFeeRate: 1.05m));

        // OrderItem validation
        Assert.Throws<ArgumentException>(() => new OrderItem(Guid.Empty, "Item", 100m, 1));
        Assert.Throws<ArgumentException>(() => new OrderItem(Guid.NewGuid(), "", 100m, 1));
        Assert.Throws<ArgumentException>(() => new OrderItem(Guid.NewGuid(), "Item", -10m, 1));
        Assert.Throws<ArgumentException>(() => new OrderItem(Guid.NewGuid(), "Item", 100m, 0));
        Assert.Throws<ArgumentException>(() => new OrderItem(Guid.NewGuid(), "Item", 100m, -5));

        // Order method validations
        var order = new Order(Guid.NewGuid(), "Customer", "c@test.com", "Address", new[] { validItem });
        Assert.Throws<ArgumentException>(() => order.AssignPaymentOrderId(""));
        Assert.Throws<ArgumentException>(() => order.MarkAsPaid(""));
    }
}

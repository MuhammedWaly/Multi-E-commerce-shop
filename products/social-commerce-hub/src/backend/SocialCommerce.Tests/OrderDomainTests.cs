using SocialCommerce.Domain.Entities;
using Xunit;

namespace SocialCommerce.Tests;

public class OrderDomainTests
{
    [Fact]
    public void Order_Creation_Should_Calculate_Totals_And_Fees_Accurately()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem>
        {
            new OrderItem(Guid.NewGuid(), "Dress", 500m, 2), // 1000m
            new OrderItem(Guid.NewGuid(), "Scarf", 200m, 1)  // 200m
        };

        var order = new Order(merchantId, "John Doe", "john@example.com", "123 Nile St, Cairo", items, 0.05m);

        Assert.NotEqual(Guid.Empty, order.Id);
        Assert.Equal(1200m, order.TotalAmount);
        Assert.Equal(60m, order.PlatformFeeAmount); // 5% of 1200
        Assert.Equal(1140m, order.MerchantNetAmount); // 1200 - 60
        Assert.Equal(OrderStatus.PendingPayment, order.Status);
        Assert.Equal(2, order.Items.Count);
    }

    [Fact]
    public void Order_Creation_Should_Throw_On_Empty_Items()
    {
        var merchantId = Guid.NewGuid();
        Assert.Throws<ArgumentException>(() =>
            new Order(merchantId, "John Doe", "john@example.com", "Address", new List<OrderItem>())
        );
    }

    [Fact]
    public void Order_MarkAsPaid_Should_Transition_Status_And_Set_TransactionId()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem> { new OrderItem(Guid.NewGuid(), "Bag", 300m, 1) };
        var order = new Order(merchantId, "John Doe", "john@example.com", "Address", items);

        order.AssignPaymentOrderId("PAYPAL-123");
        Assert.Equal("PAYPAL-123", order.PaymentOrderId);

        order.MarkAsPaid("TXN-999");
        Assert.Equal(OrderStatus.Paid, order.Status);
        Assert.Equal("TXN-999", order.PaymentTransactionId);
        Assert.NotNull(order.PaidAtUtc);
    }

    [Fact]
    public void Order_Status_Transitions_Should_Enforce_Invariants()
    {
        var merchantId = Guid.NewGuid();
        var items = new List<OrderItem> { new OrderItem(Guid.NewGuid(), "Bag", 300m, 1) };
        var order = new Order(merchantId, "John Doe", "john@example.com", "Address", items);

        // Cannot fulfill before paying
        Assert.Throws<InvalidOperationException>(() => order.MarkAsFulfilled());

        order.MarkAsPaid("TXN-1");
        order.MarkAsFulfilled();
        Assert.Equal(OrderStatus.Fulfilled, order.Status);

        // Cannot cancel fulfilled order
        Assert.Throws<InvalidOperationException>(() => order.Cancel());
    }

    [Fact]
    public void MerchantLedgerEntry_Should_Validate_Parameters()
    {
        var merchantId = Guid.NewGuid();
        var entry = new MerchantLedgerEntry(merchantId, Guid.NewGuid(), LedgerEntryType.CreditSale, 500m, "Sale Credit");

        Assert.NotEqual(Guid.Empty, entry.Id);
        Assert.Equal(500m, entry.Amount);
        Assert.Equal(LedgerEntryType.CreditSale, entry.Type);

        Assert.Throws<ArgumentException>(() =>
            new MerchantLedgerEntry(merchantId, null, LedgerEntryType.Payout, -10m, "Invalid Payout")
        );
    }
}

namespace SocialCommerce.Domain.Entities;

public enum OrderStatus
{
    PendingPayment = 0,
    Paid = 1,
    Fulfilled = 2,
    Cancelled = 3,
    Pending = 4,
    AwaitingPayment = 5,
    Processing = 6
}

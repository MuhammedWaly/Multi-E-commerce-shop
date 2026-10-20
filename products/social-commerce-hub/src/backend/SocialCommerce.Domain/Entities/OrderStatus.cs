namespace SocialCommerce.Domain.Entities;

public enum OrderStatus
{
    PendingPayment = 0,
    Paid = 1,
    Fulfilled = 2,
    Cancelled = 3
}

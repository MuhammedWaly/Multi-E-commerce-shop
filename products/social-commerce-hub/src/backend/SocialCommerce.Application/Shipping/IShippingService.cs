namespace SocialCommerce.Application.Shipping;

public class ShippingCalculationResult
{
    public double DistanceKm { get; set; }
    public decimal ShippingFee { get; set; }
    public int EstimatedDeliveryMinutes { get; set; }
    public double StoreLatitude { get; set; }
    public double StoreLongitude { get; set; }
    public string StoreAddress { get; set; } = string.Empty;
    public string StoreCity { get; set; } = string.Empty;
    public double CustomerLatitude { get; set; }
    public double CustomerLongitude { get; set; }
    public string FormattedEta { get; set; } = string.Empty;
}

public class CalculateShippingDto
{
    public Guid MerchantId { get; set; }
    public double CustomerLatitude { get; set; }
    public double CustomerLongitude { get; set; }
}

public class OrderTrackingDto
{
    public Guid OrderId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public double? DeliveryLatitude { get; set; }
    public double? DeliveryLongitude { get; set; }
    public double DistanceKm { get; set; }
    public decimal ShippingFee { get; set; }
    public int EstimatedDeliveryMinutes { get; set; }
    public string FormattedEta { get; set; } = string.Empty;
    public string StoreName { get; set; } = string.Empty;
    public string StoreAddress { get; set; } = string.Empty;
    public string StoreCity { get; set; } = string.Empty;
    public double StoreLatitude { get; set; }
    public double StoreLongitude { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public List<string> TimelineSteps { get; set; } = new();
    public int CurrentStepIndex { get; set; }
}

public interface IShippingService
{
    ShippingCalculationResult CalculateShipping(
        double storeLat,
        double storeLon,
        double customerLat,
        double customerLon,
        string storeAddress = "",
        string storeCity = "");
}

using SocialCommerce.Application.Shipping;

namespace SocialCommerce.Infrastructure.Services;

public class ShippingCalculationService : IShippingService
{
    private const double EarthRadiusKm = 6371.0;
    private const decimal BaseFee = 25.00m; // First 5 km
    private const decimal RatePerKm = 3.00m; // Over 5 km
    private const int BasePrepMinutes = 25;
    private const double MinutesPerKm = 3.5;

    public ShippingCalculationResult CalculateShipping(
        double storeLat,
        double storeLon,
        double customerLat,
        double customerLon,
        string storeAddress = "",
        string storeCity = "")
    {
        // Fallback default coordinates if not provided (Zamalek, Cairo)
        if (Math.Abs(storeLat) < 0.001 && Math.Abs(storeLon) < 0.001)
        {
            storeLat = 30.0626;
            storeLon = 31.2223;
        }

        double distanceKm;
        if (Math.Abs(customerLat) > 0.001 && Math.Abs(customerLon) > 0.001)
        {
            distanceKm = CalculateHaversineDistance(storeLat, storeLon, customerLat, customerLon);
        }
        else
        {
            // Default assumed inner-city distance
            distanceKm = 5.0;
        }

        // Round distance to 1 decimal place
        distanceKm = Math.Round(Math.Max(0.5, distanceKm), 1);

        // Platform shipping fee formula: Base 25 EGP up to 5km, + 3 EGP per additional km
        decimal fee;
        if (distanceKm <= 5.0)
        {
            fee = BaseFee;
        }
        else
        {
            var extraKm = (decimal)(distanceKm - 5.0);
            fee = BaseFee + Math.Round(extraKm * RatePerKm, 2);
        }

        // ETA calculation
        int etaMinutes = BasePrepMinutes + (int)Math.Round(distanceKm * MinutesPerKm);
        etaMinutes = Math.Clamp(etaMinutes, 20, 180);

        string formattedEta = etaMinutes < 60
            ? $"{etaMinutes} mins"
            : $"{etaMinutes / 60}h {etaMinutes % 60}m";

        return new ShippingCalculationResult
        {
            DistanceKm = distanceKm,
            ShippingFee = fee,
            EstimatedDeliveryMinutes = etaMinutes,
            FormattedEta = formattedEta,
            StoreLatitude = storeLat,
            StoreLongitude = storeLon,
            StoreAddress = string.IsNullOrWhiteSpace(storeAddress) ? "Zamalek, Cairo" : storeAddress,
            StoreCity = string.IsNullOrWhiteSpace(storeCity) ? "Cairo" : storeCity,
            CustomerLatitude = customerLat,
            CustomerLongitude = customerLon
        };
    }

    private static double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
}

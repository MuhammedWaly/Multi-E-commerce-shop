using SocialCommerce.Application.Shipping;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class ShippingCalculationTests
{
    private readonly ShippingCalculationService _service = new();

    [Fact]
    public void CalculateShipping_Within5Km_Should_Charge_BaseFee_25EGP()
    {
        // Zamalek, Cairo to Downtown Cairo (approx 2.5 km)
        var result = _service.CalculateShipping(30.0626, 31.2223, 30.0444, 31.2357);

        Assert.True(result.DistanceKm <= 5.0);
        Assert.Equal(25.00m, result.ShippingFee);
        Assert.True(result.EstimatedDeliveryMinutes >= 20);
        Assert.NotEmpty(result.FormattedEta);
    }

    [Fact]
    public void CalculateShipping_Over5Km_Should_Charge_Progressive_Fee()
    {
        // Zamalek, Cairo to Maadi, Cairo (approx 12-14 km)
        var result = _service.CalculateShipping(30.0626, 31.2223, 29.9602, 31.2569);

        Assert.True(result.DistanceKm > 5.0);
        // Base 25 + (distance - 5) * 3
        var expectedFee = 25.00m + Math.Round((decimal)(result.DistanceKm - 5.0) * 3.00m, 2);
        Assert.Equal(expectedFee, result.ShippingFee);
    }

    [Fact]
    public void CalculateShipping_ZeroCustomerCoords_Should_Fallback_To_InnerCity_Default()
    {
        var result = _service.CalculateShipping(30.0626, 31.2223, 0, 0);

        Assert.Equal(5.0, result.DistanceKm);
        Assert.Equal(25.00m, result.ShippingFee);
    }

    [Fact]
    public void CalculateShipping_SameLocation_Should_Charge_BaseFee()
    {
        var result = _service.CalculateShipping(30.0626, 31.2223, 30.0626, 31.2223);

        Assert.True(result.DistanceKm <= 1.0);
        Assert.Equal(25.00m, result.ShippingFee);
    }
}

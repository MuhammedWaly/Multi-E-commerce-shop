using SocialCommerce.Domain.Entities;
using Xunit;

namespace SocialCommerce.Tests;

public class DomainEntitiesTests
{
    [Fact]
    public void Merchant_Creation_Should_Succeed_With_Valid_Data()
    {
        var merchant = new Merchant("Boutique Cairo", "boutique-cairo", "sari@example.com");

        Assert.NotEqual(Guid.Empty, merchant.Id);
        Assert.Equal("Boutique Cairo", merchant.StoreName);
        Assert.Equal("boutique-cairo", merchant.Slug);
        Assert.Equal(0m, merchant.Balance);
        Assert.True(merchant.IsActive);
    }

    [Theory]
    [InlineData("", "slug", "email@test.com")]
    [InlineData("Store", "", "email@test.com")]
    [InlineData("Store", "slug", "")]
    public void Merchant_Creation_Should_Throw_On_Empty_Parameters(string name, string slug, string email)
    {
        Assert.Throws<ArgumentException>(() => new Merchant(name, slug, email));
    }

    [Fact]
    public void Merchant_Payout_Should_Throw_When_Exceeding_Balance()
    {
        var merchant = new Merchant("Store", "store", "store@test.com");
        merchant.CreditBalance(100m);

        Assert.Throws<InvalidOperationException>(() => merchant.PayoutBalance(150m));
        Assert.Equal(100m, merchant.Balance);
    }

    [Fact]
    public void Product_Creation_Should_Succeed_And_DeductStock_Properly()
    {
        var merchantId = Guid.NewGuid();
        var product = new Product(merchantId, "Summer Dress", 450m, "https://media.com/dress.jpg", false, 10);

        Assert.Equal(10, product.StockQuantity);

        product.ReduceStock(3);
        Assert.Equal(7, product.StockQuantity);

        Assert.Throws<InvalidOperationException>(() => product.ReduceStock(10));
    }

    [Fact]
    public void Product_Price_Update_Should_Throw_On_Negative_Value()
    {
        var product = new Product(Guid.NewGuid(), "Shirt", 200m, "https://media.com/shirt.jpg", false, 5);

        Assert.Throws<ArgumentException>(() => product.UpdatePrice(-50m));
    }
}

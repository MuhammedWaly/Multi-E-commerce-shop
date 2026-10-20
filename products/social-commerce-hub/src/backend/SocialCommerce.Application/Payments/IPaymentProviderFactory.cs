namespace SocialCommerce.Application.Payments;

public interface IPaymentProviderFactory
{
    IPaymentProvider GetProvider(string providerName);
    IPaymentProvider GetDefaultProvider();
}

using SocialCommerce.Application.Payments;

namespace SocialCommerce.Infrastructure.Payments;

public class PaymentProviderFactory : IPaymentProviderFactory
{
    private readonly IEnumerable<IPaymentProvider> _providers;

    public PaymentProviderFactory(IEnumerable<IPaymentProvider> providers)
    {
        _providers = providers;
    }

    public IPaymentProvider GetProvider(string providerName)
    {
        var provider = _providers.FirstOrDefault(p => p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase));
        return provider ?? throw new NotSupportedException($"Payment provider '{providerName}' is not registered.");
    }

    public IPaymentProvider GetDefaultProvider()
    {
        return GetProvider("PayPal");
    }
}

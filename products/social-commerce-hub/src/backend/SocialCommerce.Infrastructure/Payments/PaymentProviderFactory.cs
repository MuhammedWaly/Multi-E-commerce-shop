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
        if (string.IsNullOrWhiteSpace(providerName))
        {
            return GetDefaultProvider();
        }

        var normalized = NormalizeProviderName(providerName);
        var provider = _providers.FirstOrDefault(p =>
            NormalizeProviderName(p.ProviderName).Equals(normalized, StringComparison.OrdinalIgnoreCase) ||
            p.ProviderName.Equals(providerName.Trim(), StringComparison.OrdinalIgnoreCase));

        return provider ?? throw new NotSupportedException($"Payment provider '{providerName}' is not registered.");
    }

    public IPaymentProvider GetDefaultProvider()
    {
        return GetProvider("PayPal");
    }

    public static string NormalizeProviderName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "PayPal";

        var lower = name.Trim().ToLowerInvariant().Replace("-", "").Replace("_", "").Replace(" ", "");
        if (lower is "cod" or "cashondelivery" or "cash")
            return "CashOnDelivery";
        if (lower is "fawry" or "fawrypay")
            return "Fawry";
        if (lower is "instapay" or "mobilewallet" or "vodafonecash" or "orangemoney" or "etisalatcash" or "wepay" or "wallet")
            return "InstaPay";
        if (lower is "paypal")
            return "PayPal";

        return name.Trim();
    }
}

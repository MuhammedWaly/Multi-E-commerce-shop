using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Infrastructure.Services;

public class PromoCodeService : IPromoService
{
    public ValidatePromoResponse ValidatePromoCode(string code, decimal itemsSubtotal)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return new ValidatePromoResponse(false, string.Empty, 0m, string.Empty, "يرجى إدخال كود الخصم / Please enter a promo code.");
        }

        var normalizedCode = code.Trim().ToUpperInvariant();

        switch (normalizedCode)
        {
            case "WELCOME10":
            {
                var discount = Math.Round(itemsSubtotal * 0.10m, 2);
                discount = Math.Min(100m, discount); // cap at 100 EGP
                if (discount <= 0) discount = 10m;
                return new ValidatePromoResponse(true, normalizedCode, discount, "خصم ترحيبي 10% مطبق بنجاح / Welcome 10% discount applied.");
            }

            case "EGYPT2026":
            {
                var discount = Math.Round(itemsSubtotal * 0.15m, 2);
                discount = Math.Min(150m, discount); // cap at 150 EGP
                if (discount <= 0) discount = 15m;
                return new ValidatePromoResponse(true, normalizedCode, discount, "كود مصر 2026: خصم 15% مطبق / Egypt 2026: 15% discount applied.");
            }

            case "FREESHIP":
            {
                var discount = 25m; // standard base shipping fee covered
                return new ValidatePromoResponse(true, normalizedCode, discount, "شحن مجاني أساسي (خصم 25 ج.م) / Free base shipping (25 EGP off).");
            }

            case "SAVE50":
            {
                if (itemsSubtotal < 300m)
                {
                    return new ValidatePromoResponse(false, normalizedCode, 0m, string.Empty, "الكود يتطلب حد أدنى للطلب 300 ج.م / Requires minimum order of 300 EGP.");
                }
                return new ValidatePromoResponse(true, normalizedCode, 50m, "خصم فوري 50 ج.م مطبق / Instant 50 EGP discount applied.");
            }

            default:
                return new ValidatePromoResponse(false, normalizedCode, 0m, string.Empty, "كود الخصم غير صحيح أو منتهي الصلاحية / Invalid or expired promo code.");
        }
    }
}

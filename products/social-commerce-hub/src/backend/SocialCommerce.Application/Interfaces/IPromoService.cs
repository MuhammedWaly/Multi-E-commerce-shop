using SocialCommerce.Application.DTOs;

namespace SocialCommerce.Application.Interfaces;

public interface IPromoService
{
    ValidatePromoResponse ValidatePromoCode(string code, decimal itemsSubtotal);
}

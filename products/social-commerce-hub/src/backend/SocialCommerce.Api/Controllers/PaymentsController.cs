using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;

namespace SocialCommerce.Api.Controllers;

[Route("api/[controller]")]
public class PaymentsController : BaseApiController
{
    private readonly IPaymentProviderFactory _paymentFactory;

    public PaymentsController(IPaymentProviderFactory paymentFactory)
    {
        _paymentFactory = paymentFactory;
    }

    /// <summary>
    /// Initiates a payment transaction session with payment gateway
    /// </summary>
    [HttpPost("create-order")]
    [ProducesResponseType(typeof(ApiResponse<PaymentOrderResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<PaymentOrderResult>>> CreatePaymentOrder(
        [FromBody] PaymentOrderRequest request,
        CancellationToken ct = default)
    {
        var provider = _paymentFactory.GetDefaultProvider();
        var result = await provider.CreatePaymentOrderAsync(request, ct);

        if (!result.IsSuccess)
        {
            return Failed<PaymentOrderResult>(result.ErrorMessage ?? "Payment order creation failed.", "Payment initiation failed.", StatusCodes.Status400BadRequest);
        }

        return Success(result, "Payment order initiated successfully.");
    }
}

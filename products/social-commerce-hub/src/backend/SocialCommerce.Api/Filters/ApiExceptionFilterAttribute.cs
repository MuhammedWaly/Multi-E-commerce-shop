using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SocialCommerce.Application.Common;

namespace SocialCommerce.Api.Filters;

public class ApiExceptionFilterAttribute : ExceptionFilterAttribute
{
    private readonly ILogger<ApiExceptionFilterAttribute> _logger;

    public ApiExceptionFilterAttribute(ILogger<ApiExceptionFilterAttribute> logger)
    {
        _logger = logger;
    }

    public override void OnException(ExceptionContext context)
    {
        _logger.LogError(context.Exception, "Unhandled exception occurred: {Message}", context.Exception.Message);

        var (statusCode, message, error) = context.Exception switch
        {
            ArgumentException argEx => (
                StatusCodes.Status400BadRequest,
                "Invalid request parameters.",
                argEx.Message
            ),
            InvalidOperationException invEx => (
                StatusCodes.Status400BadRequest,
                "Operation rejected by business rules.",
                invEx.Message
            ),
            KeyNotFoundException notFoundEx => (
                StatusCodes.Status404NotFound,
                "The requested resource was not found.",
                notFoundEx.Message
            ),
            UnauthorizedAccessException => (
                StatusCodes.Status401Unauthorized,
                "Access denied.",
                "You are not authorized to perform this action."
            ),
            _ => (
                StatusCodes.Status500InternalServerError,
                "An unexpected internal error occurred.",
                "An internal server error occurred while processing your request."
            )
        };

        var response = ApiResponse<object>.Fail(error, message);

        context.Result = new ObjectResult(response)
        {
            StatusCode = statusCode
        };

        context.ExceptionHandled = true;
    }
}

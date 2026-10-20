using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SocialCommerce.Application.Common;

namespace SocialCommerce.Api.Filters;

public class ValidateModelAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var errors = context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(msg => !string.IsNullOrWhiteSpace(msg))
                .ToList();

            if (errors.Count == 0)
            {
                errors.Add("Invalid model state.");
            }

            var response = ApiResponse<object>.Fail(errors, "Model validation failed.");
            context.Result = new BadRequestObjectResult(response);
        }
    }
}

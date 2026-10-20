using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;

namespace SocialCommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected ActionResult<ApiResponse<T>> Success<T>(T data, string message = "Request completed successfully.")
    {
        return Ok(ApiResponse<T>.Ok(data, message));
    }

    protected ActionResult<ApiResponse<T>> CreatedSuccess<T>(string uri, T data, string message = "Resource created successfully.")
    {
        return Created(uri, ApiResponse<T>.Ok(data, message));
    }

    protected ActionResult<ApiResponse<T>> Failed<T>(string error, string message = "Request failed.", int statusCode = 400)
    {
        return StatusCode(statusCode, ApiResponse<T>.Fail(error, message));
    }
}

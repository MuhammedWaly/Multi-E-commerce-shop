using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using SocialCommerce.Api.Filters;
using SocialCommerce.Application.Common;
using Xunit;

namespace SocialCommerce.Tests;

public class ApiResponseAndFilterTests
{
    [Fact]
    public void ApiResponse_Ok_SetsPropertiesCorrectly()
    {
        var data = new { Id = 123, Name = "Item" };
        var response = ApiResponse<object>.Ok(data, "All good");

        Assert.True(response.Success);
        Assert.Equal("All good", response.Message);
        Assert.Equal(data, response.Data);
        Assert.Null(response.Errors);
    }

    [Fact]
    public void ApiResponse_Fail_SingleError_SetsPropertiesCorrectly()
    {
        var response = ApiResponse<string>.Fail("Invalid slug", "Validation error");

        Assert.False(response.Success);
        Assert.Equal("Validation error", response.Message);
        Assert.Null(response.Data);
        Assert.NotNull(response.Errors);
        Assert.Single(response.Errors);
        Assert.Equal("Invalid slug", response.Errors[0]);
    }

    [Fact]
    public void ApiResponse_Fail_MultipleErrors_SetsPropertiesCorrectly()
    {
        var errors = new List<string> { "Error 1", "Error 2" };
        var response = ApiResponse<string>.Fail(errors, "Multiple failures");

        Assert.False(response.Success);
        Assert.Equal(2, response.Errors!.Count);
        Assert.Contains("Error 1", response.Errors);
        Assert.Contains("Error 2", response.Errors);
    }

    [Fact]
    public void ApiExceptionFilter_ArgumentException_Returns400WithEnvelope()
    {
        var filter = new ApiExceptionFilterAttribute(NullLogger<ApiExceptionFilterAttribute>.Instance);
        var httpContext = new DefaultHttpContext();
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        var exceptionContext = new ExceptionContext(actionContext, new List<IFilterMetadata>())
        {
            Exception = new ArgumentException("Slug cannot be empty")
        };

        filter.OnException(exceptionContext);

        Assert.True(exceptionContext.ExceptionHandled);
        var result = Assert.IsType<ObjectResult>(exceptionContext.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, result.StatusCode);

        var apiResponse = Assert.IsType<ApiResponse<object>>(result.Value);
        Assert.False(apiResponse.Success);
        Assert.Equal("Invalid request parameters.", apiResponse.Message);
        Assert.NotNull(apiResponse.Errors);
        Assert.Contains("Slug cannot be empty", apiResponse.Errors);
    }

    [Fact]
    public void ApiExceptionFilter_InvalidOperationException_Returns400WithEnvelope()
    {
        var filter = new ApiExceptionFilterAttribute(NullLogger<ApiExceptionFilterAttribute>.Instance);
        var httpContext = new DefaultHttpContext();
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        var exceptionContext = new ExceptionContext(actionContext, new List<IFilterMetadata>())
        {
            Exception = new InvalidOperationException("Insufficient inventory available")
        };

        filter.OnException(exceptionContext);

        Assert.True(exceptionContext.ExceptionHandled);
        var result = Assert.IsType<ObjectResult>(exceptionContext.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, result.StatusCode);

        var apiResponse = Assert.IsType<ApiResponse<object>>(result.Value);
        Assert.False(apiResponse.Success);
        Assert.Equal("Operation rejected by business rules.", apiResponse.Message);
        Assert.NotNull(apiResponse.Errors);
        Assert.Contains("Insufficient inventory available", apiResponse.Errors);
    }

    [Fact]
    public void ApiExceptionFilter_KeyNotFoundException_Returns404WithEnvelope()
    {
        var filter = new ApiExceptionFilterAttribute(NullLogger<ApiExceptionFilterAttribute>.Instance);
        var httpContext = new DefaultHttpContext();
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        var exceptionContext = new ExceptionContext(actionContext, new List<IFilterMetadata>())
        {
            Exception = new KeyNotFoundException("Order 123 not found")
        };

        filter.OnException(exceptionContext);

        Assert.True(exceptionContext.ExceptionHandled);
        var result = Assert.IsType<ObjectResult>(exceptionContext.Result);
        Assert.Equal(StatusCodes.Status404NotFound, result.StatusCode);

        var apiResponse = Assert.IsType<ApiResponse<object>>(result.Value);
        Assert.False(apiResponse.Success);
        Assert.Equal("The requested resource was not found.", apiResponse.Message);
    }

    [Fact]
    public void ValidateModelAttribute_InvalidModelState_SetsBadRequestResultWithEnvelope()
    {
        var filter = new ValidateModelAttribute();
        var httpContext = new DefaultHttpContext();
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        actionContext.ModelState.AddModelError("Name", "Name is required");

        var executingContext = new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            new object()
        );

        filter.OnActionExecuting(executingContext);

        var result = Assert.IsType<BadRequestObjectResult>(executingContext.Result);
        var apiResponse = Assert.IsType<ApiResponse<object>>(result.Value);
        Assert.False(apiResponse.Success);
        Assert.Equal("Model validation failed.", apiResponse.Message);
        Assert.NotNull(apiResponse.Errors);
        Assert.Contains("Name is required", apiResponse.Errors);
    }
}

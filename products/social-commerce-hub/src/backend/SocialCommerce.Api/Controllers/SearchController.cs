using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Api.Controllers;

[Route("api/[controller]")]
public class SearchController : BaseApiController
{
    private readonly ICatalogService _catalogService;

    public SearchController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    /// <summary>
    /// Searches products and merchants with rank-ordered scoring and automatic nearest/fuzzy match fallback
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<SearchResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<SearchResponseDto>>> Search(
        [FromQuery] string? q,
        CancellationToken ct = default)
    {
        var response = await _catalogService.SearchAsync(q ?? string.Empty, ct);
        return Success(response, "Search results retrieved successfully.");
    }
}

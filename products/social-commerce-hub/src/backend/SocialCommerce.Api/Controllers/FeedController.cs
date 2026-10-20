using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Api.Controllers;

[Route("api/[controller]")]
public class FeedController : BaseApiController
{
    private readonly ICatalogService _catalogService;

    public FeedController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    /// <summary>
    /// Retrieves paginated visual discovery feed for the marketplace
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FeedItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FeedItemDto>>>> GetFeed(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var p = page < 1 ? 1 : page;
        var size = pageSize is < 1 or > 100 ? 20 : pageSize;

        var feed = await _catalogService.GetFeedAsync(p, size, ct);
        return Success(feed, "Discovery feed retrieved successfully.");
    }
}

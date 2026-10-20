using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Api.Controllers;

[Route("api/[controller]")]
public class MediaController : BaseApiController
{
    private readonly IMediaService _mediaService;

    public MediaController(IMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    /// <summary>
    /// Uploads an image or video asset for merchant product catalog
    /// </summary>
    [Authorize(Roles = "Merchant")]
    [HttpPost("upload")]
    [RequestSizeLimit(70 * 1024 * 1024)] // 70 MB
    [RequestFormLimits(MultipartBodyLengthLimit = 70 * 1024 * 1024)]
    [ProducesResponseType(typeof(ApiResponse<MediaUploadResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<MediaUploadResponseDto>>> UploadMedia(
        IFormFile? file,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            return Failed<MediaUploadResponseDto>("No file was uploaded or the file is empty.", "Invalid file.", StatusCodes.Status400BadRequest);
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var response = await _mediaService.SaveMediaAsync(
                stream,
                file.FileName,
                file.ContentType,
                file.Length,
                ct);

            return CreatedSuccess(response.Url, response, "Media uploaded successfully.");
        }
        catch (ArgumentException ex)
        {
            return Failed<MediaUploadResponseDto>(ex.Message, "Validation failed.", StatusCodes.Status400BadRequest);
        }
    }
}

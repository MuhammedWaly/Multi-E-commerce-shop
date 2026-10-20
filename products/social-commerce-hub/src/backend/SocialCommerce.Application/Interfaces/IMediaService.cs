using SocialCommerce.Application.DTOs;

namespace SocialCommerce.Application.Interfaces;

public interface IMediaService
{
    Task<MediaUploadResponseDto> SaveMediaAsync(
        Stream contentStream,
        string originalFileName,
        string contentType,
        long length,
        CancellationToken ct = default);
}

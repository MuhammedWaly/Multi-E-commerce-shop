using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Infrastructure.Services;

public class MediaService : IMediaService
{
    private readonly string _uploadsDirectory;

    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    private static readonly HashSet<string> AllowedVideoExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp4", ".webm", ".mov", ".mkv"
    };

    private const long MaxImageSizeBytes = 15 * 1024 * 1024; // 15 MB
    private const long MaxVideoSizeBytes = 60 * 1024 * 1024; // 60 MB

    public MediaService(string? uploadsDirectory = null)
    {
        _uploadsDirectory = uploadsDirectory 
            ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

        if (!Directory.Exists(_uploadsDirectory))
        {
            Directory.CreateDirectory(_uploadsDirectory);
        }
    }

    public async Task<MediaUploadResponseDto> SaveMediaAsync(
        Stream contentStream,
        string originalFileName,
        string contentType,
        long length,
        CancellationToken ct = default)
    {
        if (contentStream == null)
            throw new ArgumentNullException(nameof(contentStream));

        if (string.IsNullOrWhiteSpace(originalFileName))
            throw new ArgumentException("File name cannot be empty.", nameof(originalFileName));

        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext))
        {
            throw new ArgumentException("Uploaded file must have an extension.");
        }

        var isImage = AllowedImageExtensions.Contains(ext);
        var isVideo = AllowedVideoExtensions.Contains(ext) || contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase);

        if (!isImage && !isVideo)
        {
            throw new ArgumentException($"File type '{ext}' is not supported. Allowed formats: images (JPG, PNG, WebP, GIF) or videos (MP4, WebM, MOV).");
        }

        var maxAllowedSize = isVideo ? MaxVideoSizeBytes : MaxImageSizeBytes;
        if (length > maxAllowedSize)
        {
            var maxMb = maxAllowedSize / (1024 * 1024);
            throw new ArgumentException($"File size exceeds the allowed limit of {maxMb} MB for this media type.");
        }

        // Generate safe unique filename
        var safeFileName = $"media_{Guid.NewGuid():N}{ext}";
        var destinationPath = Path.Combine(_uploadsDirectory, safeFileName);

        await using (var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, true))
        {
            await contentStream.CopyToAsync(fileStream, ct);
        }

        var relativeUrl = $"/uploads/{safeFileName}";

        return new MediaUploadResponseDto(
            Url: relativeUrl,
            FileName: safeFileName,
            ContentType: contentType,
            SizeBytes: length,
            IsVideo: isVideo
        );
    }
}

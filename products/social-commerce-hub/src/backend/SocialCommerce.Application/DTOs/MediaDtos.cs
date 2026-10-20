namespace SocialCommerce.Application.DTOs;

public record MediaUploadResponseDto(
    string Url,
    string FileName,
    string ContentType,
    long SizeBytes,
    bool IsVideo
);

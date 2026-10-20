using System.Text;
using SocialCommerce.Infrastructure.Services;
using Xunit;

namespace SocialCommerce.Tests;

public class MediaUploadTests : IDisposable
{
    private readonly string _testUploadsDir;

    public MediaUploadTests()
    {
        _testUploadsDir = Path.Combine(Path.GetTempPath(), "SocialCommerce_Test_Uploads_" + Guid.NewGuid().ToString("N"));
    }

    public void Dispose()
    {
        if (Directory.Exists(_testUploadsDir))
        {
            try { Directory.Delete(_testUploadsDir, true); } catch { }
        }
    }

    [Fact]
    public async Task MediaService_SavesValidImage_Successfully()
    {
        var service = new MediaService(_testUploadsDir);
        var bytes = Encoding.UTF8.GetBytes("fake-image-binary-data");
        using var stream = new MemoryStream(bytes);

        var result = await service.SaveMediaAsync(stream, "linen-dress.jpg", "image/jpeg", bytes.Length);

        Assert.NotNull(result);
        Assert.False(result.IsVideo);
        Assert.StartsWith("/uploads/media_", result.Url);
        Assert.EndsWith(".jpg", result.Url);

        var savedPath = Path.Combine(_testUploadsDir, result.FileName);
        Assert.True(File.Exists(savedPath));
    }

    [Fact]
    public async Task MediaService_SavesValidVideo_AndDetectsVideoFlag()
    {
        var service = new MediaService(_testUploadsDir);
        var bytes = Encoding.UTF8.GetBytes("fake-mp4-video-stream-content");
        using var stream = new MemoryStream(bytes);

        var result = await service.SaveMediaAsync(stream, "craft-teaser.mp4", "video/mp4", bytes.Length);

        Assert.NotNull(result);
        Assert.True(result.IsVideo);
        Assert.StartsWith("/uploads/media_", result.Url);
        Assert.EndsWith(".mp4", result.Url);

        var savedPath = Path.Combine(_testUploadsDir, result.FileName);
        Assert.True(File.Exists(savedPath));
    }

    [Fact]
    public async Task MediaService_RejectsUnsupportedExtension()
    {
        var service = new MediaService(_testUploadsDir);
        var bytes = Encoding.UTF8.GetBytes("malicious-code");
        using var stream = new MemoryStream(bytes);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.SaveMediaAsync(stream, "script.exe", "application/octet-stream", bytes.Length));
    }

    [Fact]
    public async Task MediaService_RejectsOversizedImage()
    {
        var service = new MediaService(_testUploadsDir);
        using var stream = new MemoryStream(new byte[100]);
        var oversizedLength = 20 * 1024 * 1024; // 20 MB (Limit is 15MB)

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.SaveMediaAsync(stream, "huge.png", "image/png", oversizedLength));
    }
}

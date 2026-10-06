namespace Ecommerce_shoes.Services;

public interface ICloudflareR2Service
{
    /// <summary>
    /// Uploads a file to Cloudflare R2 and returns the URL to store in the database.
    /// </summary>
    Task<string> UploadAsync(Stream fileStream, string objectKey, string contentType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets an object from R2; returns (true, contentType) and copies to destination, or (false, null).
    /// </summary>
    Task<(bool found, string? contentType)> GetObjectAsync(string objectKey, Stream destination, CancellationToken cancellationToken = default);
}

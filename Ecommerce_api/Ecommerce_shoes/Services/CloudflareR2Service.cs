using Amazon.S3;
using Amazon.S3.Model;

namespace Ecommerce_shoes.Services;

public class CloudflareR2Service : ICloudflareR2Service
{
    private readonly IAmazonS3? _s3Client;
    private readonly string _bucketName;
    private readonly string _publicBaseUrl;
    private readonly bool _isConfigured;

    public CloudflareR2Service(IConfiguration configuration)
    {
        var accountId = configuration["CloudflareR2:AccountId"] ?? "";
        _bucketName = configuration["CloudflareR2:BucketName"] ?? "ecommerce";
        var accessKey = configuration["CloudflareR2:AccessKeyId"] ?? "";
        var secretKey = configuration["CloudflareR2:SecretAccessKey"] ?? "";
        _publicBaseUrl = (configuration["CloudflareR2:PublicBaseUrl"] ?? "").TrimEnd('/');

        _isConfigured = !string.IsNullOrWhiteSpace(accountId) && !string.IsNullOrWhiteSpace(accessKey) && !string.IsNullOrWhiteSpace(secretKey);

        if (_isConfigured)
        {
            var endpoint = $"https://{accountId}.r2.cloudflarestorage.com";
            var config = new AmazonS3Config
            {
                ServiceURL = endpoint,
                ForcePathStyle = true,
                AuthenticationRegion = "auto"
            };
            _s3Client = new AmazonS3Client(accessKey, secretKey, config);
        }
        else
            _s3Client = null;
    }

    public async Task<string> UploadAsync(Stream fileStream, string objectKey, string contentType, CancellationToken cancellationToken = default)
    {
        if (_s3Client == null || !_isConfigured)
            throw new InvalidOperationException("Cloudflare R2 is not configured. Set CloudflareR2:AccountId, AccessKeyId, SecretAccessKey in appsettings.");

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            InputStream = fileStream,
            ContentType = contentType,
            DisablePayloadSigning = true
        };

        await _s3Client.PutObjectAsync(request, cancellationToken);

        return string.IsNullOrEmpty(_publicBaseUrl)
            ? $"/{_bucketName}/{objectKey}"
            : $"{_publicBaseUrl}/{objectKey}";
    }

    public async Task<(bool found, string? contentType)> GetObjectAsync(string objectKey, Stream destination, CancellationToken cancellationToken = default)
    {
        if (_s3Client == null || !_isConfigured) return (false, null);
        try
        {
            var request = new GetObjectRequest { BucketName = _bucketName, Key = objectKey };
            using var response = await _s3Client.GetObjectAsync(request, cancellationToken);
            var contentType = response.Headers?.ContentType ?? "image/jpeg";
            await response.ResponseStream.CopyToAsync(destination, cancellationToken);
            return (true, contentType);
        }
        catch
        {
            return (false, null);
        }
    }
}

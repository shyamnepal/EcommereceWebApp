using Amazon.S3;
using DataAcess.Entity;
using Ecommerce_shoes.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShoesRepository.GenreicRepo;
using ShoesShared.ShopesResponse;

namespace Ecommerce_shoes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BucketController : ControllerBase
    {
        private readonly IGenericRepository<Product> _genericRepo;
        private readonly IConfiguration _configuration;
        private readonly IGenericRepository<ProductImage> _contextImage;
        private readonly ICloudflareR2Service _r2Service;

        public BucketController(
            IGenericRepository<Product> genericRepository,
            IConfiguration configuration,
            IGenericRepository<ProductImage> contextImage,
            ICloudflareR2Service r2Service)
        {
            _genericRepo = genericRepository;
            _configuration = configuration;
            _contextImage = contextImage;
            _r2Service = r2Service;
        }

        [HttpGet("Image")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage([FromQuery] string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return BadRequest();
            var bucketName = _configuration["CloudflareR2:BucketName"] ?? "ecommerce";
            var trimmed = path.TrimStart('/');
            var objectKey = trimmed.StartsWith(bucketName + "/", StringComparison.OrdinalIgnoreCase)
                ? trimmed[(bucketName.Length + 1)..]
                : trimmed;
            if (string.IsNullOrEmpty(objectKey)) return BadRequest();
            var stream = new MemoryStream();
            var (found, contentType) = await _r2Service.GetObjectAsync(objectKey, stream, HttpContext.RequestAborted);
            if (!found) return NotFound();
            stream.Position = 0;
            return File(stream, contentType ?? "image/jpeg", Path.GetFileName(objectKey));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> UplaodImage(
            [FromForm] string productName,
            [FromForm] string brand,
            [FromForm] int productId,
            [FromForm] List<IFormFile> files,
            [FromForm] string imageAltText)
        {
            var response = new ShoesResponse();

            if (files == null || files.Count == 0)
            {
                response.Status = _configuration["Response:FailedStatus"];
                response.Message = "No files uploaded.";
                response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
                return BadRequest(response);
            }
            if (string.IsNullOrWhiteSpace(productName) && string.IsNullOrWhiteSpace(brand))
            {
                response.Status = _configuration["Response:FailedStatus"];
                response.Message = "Product name and brand are required.";
                response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
                return BadRequest(response);
            }
            var product = _genericRepo.GetById(productId);
            if (product == null)
            {
                response.Status = _configuration["Response:FailedStatus"];
                response.Message = "Product not found. Save the product first, then upload images.";
                response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
                return BadRequest(response);
            }

            var imageList = new List<ProductImage>();
            var safeFolder = $"{productId}_{(brand ?? productName ?? "img").Replace(" ", "-", StringComparison.Ordinal)}";

            try
            {
                foreach (var file in files)
                {
                    var fileName = Path.GetFileNameWithoutExtension(file.FileName);
                    var extension = Path.GetExtension(file.FileName);
                    if (string.IsNullOrEmpty(extension)) extension = ".jpg";
                    var objectKey = $"products/{safeFolder}/{fileName}_{DateTime.UtcNow.Ticks}{extension}";
                    var contentType = file.ContentType ?? "image/jpeg";

                    string imageUrl;
                    await using (var stream = file.OpenReadStream())
                    {
                        imageUrl = await _r2Service.UploadAsync(stream, objectKey, contentType);
                    }

                    imageList.Add(new ProductImage
                    {
                        ImageUrl = imageUrl,
                        createdAt = DateTime.UtcNow,
                        ProductId = productId,
                        ImageAltText = imageAltText ?? productName ?? ""
                    });
                }

                await _contextImage.AddRangeAsync(imageList);
                response.Status = _configuration["Response:SuccessStatus"];
                response.Message = "Successfully uploaded image(s) to Cloudflare R2.";
                response.ErrorCode = int.Parse(_configuration["Response:SuccessCode"]);
                return Ok(response);
            }
            catch (AmazonS3Exception ex)
            {
                response.Status = _configuration["Response:FailedStatus"];
                response.Message = ex.StatusCode == System.Net.HttpStatusCode.Forbidden || ex.ErrorCode == "AccessDenied"
                    ? "R2 Access Denied. In Cloudflare dashboard: R2 → Manage R2 API Tokens → ensure your token has 'Object Read & Write' for bucket '" + (_configuration["CloudflareR2:BucketName"] ?? "ecommerce") + "', and the bucket exists."
                    : $"R2 error: {ex.Message}";
                response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
                return StatusCode(ex.StatusCode == System.Net.HttpStatusCode.Forbidden ? 403 : 500, response);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("DeleteImage/{imageId}")]
        public  IActionResult SoftDeleteImage(int imageId)
        {
            var response = new ShoesResponse();
            var image =  _contextImage.GetById(imageId);
            if (image == null)
            {
                response.Status = _configuration["Response:FailedStatus"];
                response.Message = "NO image on this Id";
                response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
                return Ok(response);
            }

            image.IsDeleted = true;  // Soft delete
            _contextImage.Update(image);
            response.Message = "successfully delete the image";
            response.ErrorCode = int.Parse(_configuration["Response:SuccessCode"]);
            return Ok(response);

            
        }




    }
}

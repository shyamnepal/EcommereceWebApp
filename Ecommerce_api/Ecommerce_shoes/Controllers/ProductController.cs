using System.Linq;
using DataAcess.Entity;
using DataAcess.ViewModel;
using Ecommerce_shoes.Attribute;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShoesRepository.GenreicRepo;
using ShoesShared.ShopesResponse;
using System.Runtime.InteropServices;

namespace Ecommerce_shoes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[ApiKeyAuthorizationFilter("Admin")]
    //[Authorize(Roles = "Admin")]
    public class ProductController : ControllerBase
    {
        private readonly IGenericRepository<Product> _genericRepo;
        private readonly IConfiguration _configuration;
        public ProductController(IGenericRepository<Product> genricRepo, IConfiguration configuration)
        {
            _genericRepo = genricRepo;
            _configuration = configuration;
        }
        [Authorize(Roles = "Admin")]
        [HttpPost("AddProduct")]
        public async Task<IActionResult> AddProduct(ProductViewModel model)
        {
            var response = new ShoesResponse();
            if (ModelState.IsValid)
            {
                // Use max existing ProductId + 1 so the product exists before image upload (FK)
                int nextId = 1;
                var existingIds = _genericRepo.GetAll().Select(p => p.ProductId).ToList();
                if (existingIds.Count > 0)
                    nextId = existingIds.Max() + 1;

                var product = new Product()
                {
                    ProductId = nextId,
                    CategoryId = model.CategoryId,
                    Description = model.Description ?? string.Empty,
                    Price = model.Price,
                    ProductName = model.ProductName,
                    StockQuentity = model.StockQuentity
                };

                await _genericRepo.Add(product);
                response.Data = product;
                response.Status = _configuration["Response:SuccessStatus"];
                response.ErrorCode = int.Parse(_configuration["Response:SuccessCode"]);
                response.Message = "Successfully Add Product";
                return Ok(response);
            }
            response.Status = _configuration["Response:FailedStatus"];
            response.Message = "Failed to add product";
            response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
            return BadRequest(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("UpdateProduct")]
        public IActionResult EditProduct(ProductViewModel model)
        {
            var response= new ShoesResponse();
            if (ModelState.IsValid)
            {
                var product = _genericRepo.GetById(model.ProductId);
                if(product != null)
                {
                    product.ProductName=model.ProductName;
                    product.CategoryId = model.CategoryId;
                    product.StockQuentity=model.StockQuentity;
                    product.Price = model.Price;
                    product.Description=model.Description;
                   _genericRepo.Update(product);

                    //response
                    response.Data = product;
                    response.Status= _configuration["Response:SuccessStatus"];
                    response.Message = "Successfully update Product";
                    response.ErrorCode = int.Parse(_configuration["Response:SuccessCode"]);
                    return Ok(response);
                }
            }
            response.Status = _configuration["Response:FailedStatus"];
            response.Message = "Failed to Update product";
            response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
            return Ok(response);
        }

        [HttpGet("GetProductById")]
        public async Task<IActionResult> GetProductById(int id)
        {
            var response= new ShoesResponse();
            if (id!=null)
            {
                var product = await _genericRepo.GetByIdAsync(id, p => p.Category, p=> p.ProductImages.Where(p=> !p.IsDeleted));
                if (product != null)
                {
                    response.Data = product;
                    response.Status = _configuration["Response:SuccessStatus"];
                    response.Message = "Successfully Get the data By Id";
                    response.ErrorCode = int.Parse(_configuration["Response:SuccessCode"]);
                    return Ok(response);
                }
                response.Status = _configuration["Response:FailedStatus"];
                response.Message = "Product Id not found";
                response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
                return BadRequest(response);
            }
            response.Status = _configuration["Response:FailedStatus"];
            response.Message = "Id is null";
            response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
            return BadRequest(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("DeleteProduct")]
        public IActionResult DeleteProduct(int id)
        {
            var response= new ShoesResponse();
            if (id!=null)
            {
                var product = _genericRepo.GetById(id);
                if (product != null)
                {
                    _genericRepo.Remove(product);
                    response.Status = _configuration["Response:SuccessStatus"];
                    response.Message = "Successfully Delete Product";
                    response.ErrorCode = int.Parse(_configuration["Response:SuccessCode"]);
                    return Ok(response);
                }
                response.Status = _configuration["Response:FailedStatus"];
                response.Message = "Failed to delete product";
                response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
                return BadRequest(response);

            }
            response.Status = _configuration["Response:FailedStatus"];
            response.Message = "Id is null";
            response.ErrorCode = int.Parse(_configuration["Response:ErrorCode"]);
            return BadRequest(response);

        }
        [HttpGet("AllProduct")]
        public async Task<IActionResult> GetAllProduct()
        {
            return Ok(await _genericRepo.GetAllWithIncludesAsync(p => p.ProductImages.Where(p=> !p.IsDeleted), p => p.Category));  // Include Category with the Product));
        }

        /// <summary>
        /// Get product recommendations (same category, excluding the given product). Used for "You might also like".
        /// </summary>
        [HttpGet("Recommend")]
        public async Task<IActionResult> Recommend([FromQuery] int? productId, [FromQuery] int limit = 4)
        {
            if (productId == null)
            {
                var all = await _genericRepo.GetAllWithIncludesAsync(p => p.ProductImages.Where(img => !img.IsDeleted), p => p.Category);
                var take = all.Take(Math.Clamp(limit, 1, 12)).ToList();
                return Ok(take);
            }
            var current = await _genericRepo.GetByIdAsync(productId.Value, p => p.Category, p => p.ProductImages.Where(img => !img.IsDeleted));
            if (current == null)
                return NotFound(new { message = "Product not found." });
            var categoryId = current.CategoryId;
            var allProducts = await _genericRepo.GetAllWithIncludesAsync(p => p.ProductImages.Where(img => !img.IsDeleted), p => p.Category);
            var recommended = allProducts
                .Where(p => p.ProductId != productId && (categoryId == null || p.CategoryId == categoryId))
                .Take(Math.Clamp(limit, 1, 12))
                .ToList();
            if (recommended.Count < limit)
            {
                var extra = allProducts
                    .Where(p => p.ProductId != productId && (categoryId == null || p.CategoryId != categoryId))
                    .Take(Math.Clamp(limit - recommended.Count, 0, 12))
                    .ToList();
                recommended.AddRange(extra);
            }
            return Ok(recommended);
        }
    }
}

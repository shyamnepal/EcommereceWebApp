using MyApi.DTOs;
using MyApi.Models;
using MyApi.Repositories;

namespace MyApi.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _repo;

    public ProductService(IProductRepository repo) => _repo = repo;

    public async Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var p = await _repo.GetByIdAsync(id, ct);
        return p == null ? null : ToDto(p);
    }

    public async Task<IReadOnlyList<ProductDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(ct);
        return list.Select(ToDto).ToList();
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken ct = default)
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            Stock = dto.Stock,
            CreatedAt = DateTime.UtcNow
        };
        var created = await _repo.AddAsync(product, ct);
        return ToDto(created);
    }

    public async Task<ProductDto?> UpdateAsync(Guid id, CreateProductDto dto, CancellationToken ct = default)
    {
        var existing = await _repo.GetByIdAsync(id, ct);
        if (existing == null) return null;
        existing.Name = dto.Name;
        existing.Description = dto.Description;
        existing.Price = dto.Price;
        existing.Stock = dto.Stock;
        var updated = await _repo.UpdateAsync(existing, ct);
        return updated == null ? null : ToDto(updated);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default) =>
        await _repo.DeleteAsync(id, ct);

    private static ProductDto ToDto(Product p) =>
        new(p.Id, p.Name, p.Description, p.Price, p.Stock, p.CreatedAt);
}

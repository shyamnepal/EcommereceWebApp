using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.Models;

namespace MyApi.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _db;

    public ProductRepository(AppDbContext db) => _db = db;

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.Products.FindAsync([id], ct);

    public async Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Products.OrderBy(p => p.Name).ToListAsync(ct);

    public async Task<Product> AddAsync(Product product, CancellationToken ct = default)
    {
        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);
        return product;
    }

    public async Task<Product?> UpdateAsync(Product product, CancellationToken ct = default)
    {
        var existing = await _db.Products.FindAsync([product.Id], ct);
        if (existing == null) return null;
        existing.Name = product.Name;
        existing.Description = product.Description;
        existing.Price = product.Price;
        existing.Stock = product.Stock;
        await _db.SaveChangesAsync(ct);
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _db.Products.FindAsync([id], ct);
        if (product == null) return false;
        _db.Products.Remove(product);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}

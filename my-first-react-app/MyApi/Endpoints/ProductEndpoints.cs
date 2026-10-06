using MyApi.DTOs;
using MyApi.Services;

namespace MyApi.Endpoints;

public static class ProductEndpoints
{
    public static void MapProductEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/products");

        group.MapGet("/", async (IProductService svc, CancellationToken ct) =>
        {
            var list = await svc.GetAllAsync(ct);
            return Results.Ok(list);
        });

        group.MapGet("/{id:guid}", async (Guid id, IProductService svc, CancellationToken ct) =>
        {
            var product = await svc.GetByIdAsync(id, ct);
            return product is null ? Results.NotFound() : Results.Ok(product);
        });

        group.MapPost("/", async (CreateProductDto dto, IProductService svc, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return Results.BadRequest("Name is required.");
            if (dto.Price < 0)
                return Results.BadRequest("Price must be non-negative.");
            var created = await svc.CreateAsync(dto, ct);
            return Results.Created($"/api/products/{created.Id}", created);
        });

        group.MapPut("/{id:guid}", async (Guid id, CreateProductDto dto, IProductService svc, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return Results.BadRequest("Name is required.");
            if (dto.Price < 0)
                return Results.BadRequest("Price must be non-negative.");
            var updated = await svc.UpdateAsync(id, dto, ct);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        });

        group.MapDelete("/{id:guid}", async (Guid id, IProductService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });
    }
}

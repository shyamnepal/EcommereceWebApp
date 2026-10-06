using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.DTOs;
using MyApi.Models;
using MyApi.Repositories;

namespace MyApi.Endpoints;

public static class OrderEndpoints
{
    public static void MapOrderEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/orders");

        group.MapGet("/", async (IOrderRepository repo, CancellationToken ct) =>
        {
            var orders = await repo.GetAllAsync(ct);
            return Results.Ok(orders.Select(ToOrderDto));
        });

        group.MapGet("/{id:guid}", async (Guid id, IOrderRepository repo, CancellationToken ct) =>
        {
            var order = await repo.GetByIdAsync(id, ct);
            return order is null ? Results.NotFound() : Results.Ok(ToOrderDto(order));
        });

        group.MapPost("/", async (CreateOrderDto dto, IOrderRepository orderRepo, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(dto.CustomerName))
                return Results.BadRequest("CustomerName is required.");
            if (dto.Items == null || dto.Items.Count == 0)
                return Results.BadRequest("At least one item is required.");

            decimal total = 0;
            var orderId = Guid.NewGuid();
            var items = new List<OrderItem>();

            foreach (var item in dto.Items)
            {
                var product = await db.Products.FindAsync([item.ProductId], ct);
                if (product == null)
                    return Results.BadRequest($"Product {item.ProductId} not found.");
                if (product.Stock < item.Quantity)
                    return Results.BadRequest($"Insufficient stock for product {product.Name}.");
                total += item.UnitPrice * item.Quantity;
                items.Add(new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ProductId = product.Id,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                });
            }

            var order = new Order
            {
                Id = orderId,
                CustomerName = dto.CustomerName,
                CustomerEmail = dto.CustomerEmail,
                Total = total,
                CreatedAt = DateTime.UtcNow,
                Items = items
            };
            await orderRepo.AddAsync(order, ct);

            return Results.Created($"/api/orders/{order.Id}", ToOrderDto(order));
        });
    }

    private static OrderDto ToOrderDto(Order o) =>
        new(
            o.Id,
            o.CustomerName,
            o.CustomerEmail,
            o.Total,
            o.CreatedAt,
            o.Items.Select(i => new OrderItemDto(i.ProductId, i.Quantity, i.UnitPrice)).ToList()
        );
}

using MyApi.Models;

namespace MyApi.Repositories;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetAllAsync(CancellationToken ct = default);
    Task<Order> AddAsync(Order order, CancellationToken ct = default);
}

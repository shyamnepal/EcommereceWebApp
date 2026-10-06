using DataAcess.Entity;
using System.Collections.Concurrent;
using System.Text.Json;

namespace ShoesRepository;

/// <summary>
/// In-memory basket store. Use when Redis is not needed (e.g. cart is in localStorage and checkout sends items in CreateOrder).
/// </summary>
public class InMemoryBasketRepository : IBasketRepository
{
    private static readonly ConcurrentDictionary<string, string> Store = new();

    public Task<CustomerBasket> GetBasketAsync(string basketId)
    {
        if (string.IsNullOrEmpty(basketId)) return Task.FromResult<CustomerBasket>(null);
        if (Store.TryGetValue(basketId, out var json) && !string.IsNullOrEmpty(json))
        {
            try
            {
                var basket = JsonSerializer.Deserialize<CustomerBasket>(json);
                return Task.FromResult(basket);
            }
            catch { }
        }
        return Task.FromResult<CustomerBasket>(null);
    }

    public Task<CustomerBasket> UpdateBasketAsync(CustomerBasket basket)
    {
        if (basket == null) return Task.FromResult<CustomerBasket>(null);
        var existing = GetBasketAsync(basket.CustomerBasketId).GetAwaiter().GetResult();
        if (existing != null)
        {
            foreach (var newItem in basket.Items)
            {
                var existingItem = existing.Items.FirstOrDefault(i => i.BasketItemId == newItem.BasketItemId);
                if (existingItem != null)
                    existingItem.Quantity += newItem.Quantity;
                else
                    existing.Items.Add(newItem);
            }
            basket = existing;
        }
        Store[basket.CustomerBasketId] = JsonSerializer.Serialize(basket);
        return Task.FromResult(basket);
    }

    public Task<bool> DeleteBasketAsync(string basketId)
    {
        return Task.FromResult(Store.TryRemove(basketId, out _));
    }
}

using DataAcess.Entity;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ShoesRepository
{
    public class BasketRepository : IBasketRepository
    {
        private readonly IDatabase _database;
        public BasketRepository(IConnectionMultiplexer redis)
        {
            _database = redis.GetDatabase();
        }

        public async Task<bool> DeleteBasketAsync(string basketId)
        {
            return await _database.KeyDeleteAsync(basketId);
        }

        public async Task<CustomerBasket> GetBasketAsync(string basketId)
        {
            var data = await _database.StringGetAsync(basketId);
            return data.IsNullOrEmpty ? null : JsonSerializer.Deserialize<CustomerBasket>(data.ToString());
        }

        public async Task<CustomerBasket> UpdateBasketAsync(CustomerBasket basket)
        {
            var existingBasket = await GetBasketAsync(basket.CustomerBasketId);

            if (existingBasket == null)
            {
                // No existing basket, so create new one
                var created = await _database.StringSetAsync(
                    basket.CustomerBasketId,
                    JsonSerializer.Serialize(basket),
                    TimeSpan.FromDays(30)
                );

                return created ? basket : null;
            }
            else
            {
                // Basket exists, append new items
                foreach (var newItem in basket.Items)
                {
                    var existingItem = existingBasket.Items.FirstOrDefault(i => i.BasketItemId == newItem.BasketItemId);
                    if (existingItem != null)
                    {
                        // If item exists, update quantity or merge logic as needed
                        existingItem.Quantity += newItem.Quantity;
                    }
                    else
                    {
                        // If item doesn't exist, add to list
                        existingBasket.Items.Add(newItem);
                    }
                }

                var updated = await _database.StringSetAsync(
                    existingBasket.CustomerBasketId,
                    JsonSerializer.Serialize(existingBasket),
                    TimeSpan.FromDays(30)
                );

                return updated ? existingBasket : null;
            }
        }


    }
}

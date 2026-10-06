using DataAcess.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoesRepository
{
    public interface IBasketRepository
    {
        Task<CustomerBasket> GetBasketAsync(String basketId);
        Task<CustomerBasket> UpdateBasketAsync(CustomerBasket basket);
        Task<bool> DeleteBasketAsync(String basketId);
    }
}

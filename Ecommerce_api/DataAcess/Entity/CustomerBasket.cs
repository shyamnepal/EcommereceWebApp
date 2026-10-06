using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAcess.Entity
{
    public class CustomerBasket
    {
        public CustomerBasket()
        {
            
        }
        public CustomerBasket(String id)
        {
            CustomerBasketId = id;
        }
        public String CustomerBasketId { get; set; }
        public List<BasketItem> Items { get; set; } = new List<BasketItem>();
    }
}

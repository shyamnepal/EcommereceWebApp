using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAcess.Entity.OrderAggregate
{
    public class OrderItem
    {
        public OrderItem()
        {
            
        }
        public OrderItem(ProductItemOrdered itemOrderd, decimal? price, int quantity)
        {

            ItemOrderd = itemOrderd;
            Price = price;
            Quantity = quantity;
        }
        [Key]
        public int OrderItemId { get; set; }

        public virtual ProductItemOrdered ItemOrderd { get; set; }
        public decimal? Price { get; set; }
        public int Quantity { get; set; }
    }
}

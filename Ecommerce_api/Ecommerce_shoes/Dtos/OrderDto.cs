using DataAcess.Entity.OrderAggregate;
using DataAcess.ViewModel;

namespace Ecommerce_shoes.Dtos
{
    public class OrderDto
    {
        public string BasketId { get; set; } = string.Empty;
        public int DeliverMethodId { get; set; }
        public Address? ShipToAddress { get; set; }
        public string? BuyerEmail { get; set; }
        /// <summary>
        /// When provided, order is created from these items (no Redis needed). Use when cart is in localStorage.
        /// </summary>
        public List<OrderItemInput>? Items { get; set; }
    }
}

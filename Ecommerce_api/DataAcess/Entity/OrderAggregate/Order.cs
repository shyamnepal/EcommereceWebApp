using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAcess.Entity.OrderAggregate
{
    public class Order
    {
        public Order() { }
        public Order(IReadOnlyList<OrderItem> orderItems, string buyerEmail, Address shipToAddress, 
            DeliveryMethod deliveryMethod, decimal? subtotal)
        {
            BuyerEmail=buyerEmail;
            ShipToAddress=shipToAddress;
            DeliveryMethod=deliveryMethod;
            Subtotal=subtotal;
            OrderItems = orderItems;
        }
        public int OrderId { get; set; } 
        public string BuyerEmail { get; set; }
        public DateTimeOffset OrderDate { get; set; }=DateTimeOffset.Now;
        public Address ShipToAddress { get; set; }
        public DeliveryMethod DeliveryMethod { get; set; }
        public IReadOnlyList<OrderItem> OrderItems { get; set; }
        public decimal? Subtotal { get; set; }
        public OrderStatus Status { get; set; }
        public string PaymentIntentId { get; set; }
        /// <summary>When Status is PaymentFailed, Stripe decline code or error message (e.g. insufficient_funds, card_declined).</summary>
        public string? PaymentFailureReason { get; set; }
        public decimal GetTotal()
        {
            return (decimal)(Subtotal + DeliveryMethod.Price);
        }
    }
}
    
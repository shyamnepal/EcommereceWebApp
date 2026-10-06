namespace Ecommerce_shoes.Dtos.Admin;

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty; // Pending, PaymentReceived, Processing, Shipped, Delivered, Cancelled, Refunded
}

namespace Ecommerce_shoes.Dtos.Admin;

public class OrderDetailDto
{
    public int OrderId { get; set; }
    public string BuyerEmail { get; set; } = string.Empty;
    public DateTimeOffset OrderDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PaymentIntentId { get; set; }
    /// <summary>When status is PaymentFailed, the Stripe decline code or error message (e.g. insufficient_funds, card_declined).</summary>
    public string? PaymentFailureReason { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DeliveryCost { get; set; }
    public decimal Total { get; set; }
    public OrderDetailAddressDto? ShipToAddress { get; set; }
    public string? DeliveryMethod { get; set; }
    public List<OrderDetailItemDto> Items { get; set; } = new();
}

public class OrderDetailAddressDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Street { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
}

public class OrderDetailItemDto
{
    public int OrderItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}

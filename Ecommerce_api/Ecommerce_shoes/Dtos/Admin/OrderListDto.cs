namespace Ecommerce_shoes.Dtos.Admin;

public class OrderListDto
{
    public int OrderId { get; set; }
    public string BuyerEmail { get; set; } = string.Empty;
    public DateTimeOffset OrderDate { get; set; }
    public string Status { get; set; } = string.Empty;
    /// <summary>When status is PaymentFailed, the Stripe reason (e.g. insufficient_funds, card_declined).</summary>
    public string? PaymentFailureReason { get; set; }
    public decimal Total { get; set; }
    public int ItemCount { get; set; }
}

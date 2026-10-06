namespace DataAcess.ViewModel;

/// <summary>
/// Cart line item for creating an order without Redis (e.g. cart from localStorage).
/// </summary>
public class OrderItemInput
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

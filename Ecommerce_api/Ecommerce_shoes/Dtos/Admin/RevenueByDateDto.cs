namespace Ecommerce_shoes.Dtos.Admin;

public class RevenueByDateDto
{
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
}

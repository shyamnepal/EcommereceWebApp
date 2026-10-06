namespace ShoesShared.ModelDto;

public class RevenueByDateResult
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
}

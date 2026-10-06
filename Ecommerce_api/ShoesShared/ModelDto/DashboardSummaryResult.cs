namespace ShoesShared.ModelDto;

public class DashboardSummaryResult
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal RevenueToday { get; set; }
    public decimal RevenueThisWeek { get; set; }
    public decimal RevenueThisMonth { get; set; }
    public int OrdersToday { get; set; }
    public int OrdersThisWeek { get; set; }
    public int OrdersThisMonth { get; set; }
}

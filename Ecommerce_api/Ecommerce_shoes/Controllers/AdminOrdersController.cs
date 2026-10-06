using DataAcess.Entity.OrderAggregate;
using Ecommerce_shoes.Dtos.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShoesRepository;

namespace Ecommerce_shoes.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly IOrderRepository _orderRepo;

    public AdminOrdersController(IOrderRepository orderRepo)
    {
        _orderRepo = orderRepo;
    }

    /// <summary>
    /// GET api/AdminOrders?page=1&pageSize=10&dateFrom=2025-01-01&dateTo=2025-01-31&status=PaymentReceived
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedOrdersResultDto>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] OrderStatus? status = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var (orders, totalCount) = await _orderRepo.GetOrdersPagedAsync(dateFrom, dateTo, status, page, pageSize);
        var items = orders.Select(MapToListDto).ToList();
        return Ok(new PagedOrdersResultDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// GET api/AdminOrders/5
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDetailDto>> GetOrderById(int id)
    {
        var order = await _orderRepo.GetOrderByIdForAdminAsync(id);
        if (order == null)
            return NotFound();
        return Ok(MapToDetailDto(order));
    }

    /// <summary>
    /// GET api/AdminOrders/Dashboard/Summary
    /// </summary>
    [HttpGet("Dashboard/Summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboardSummary()
    {
        var r = await _orderRepo.GetDashboardSummaryAsync();
        return Ok(new DashboardSummaryDto
        {
            TotalRevenue = r.TotalRevenue,
            TotalOrders = r.TotalOrders,
            RevenueToday = r.RevenueToday,
            RevenueThisWeek = r.RevenueThisWeek,
            RevenueThisMonth = r.RevenueThisMonth,
            OrdersToday = r.OrdersToday,
            OrdersThisWeek = r.OrdersThisWeek,
            OrdersThisMonth = r.OrdersThisMonth
        });
    }

    /// <summary>
    /// GET api/AdminOrders/Dashboard/RevenueByDate?dateFrom=2025-01-01&dateTo=2025-01-31
    /// </summary>
    [HttpGet("Dashboard/RevenueByDate")]
    public async Task<ActionResult<List<RevenueByDateDto>>> GetRevenueByDate(
        [FromQuery] DateTime dateFrom,
        [FromQuery] DateTime dateTo)
    {
        if (dateTo < dateFrom)
            return BadRequest("dateTo must be >= dateFrom");
        var list = await _orderRepo.GetRevenueByDateAsync(dateFrom, dateTo);
        return Ok(list.Select(x => new RevenueByDateDto
        {
            Date = x.Date.ToString("yyyy-MM-dd"),
            Revenue = x.Revenue,
            OrderCount = x.OrderCount
        }).ToList());
    }

    /// <summary>
    /// GET api/AdminOrders/Dashboard/TopProducts?limit=10&dateFrom=2025-01-01&dateTo=2025-01-31
    /// </summary>
    [HttpGet("Dashboard/TopProducts")]
    public async Task<ActionResult<List<TopSellingProductDto>>> GetTopProducts(
        [FromQuery] int limit = 10,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
    {
        var list = await _orderRepo.GetTopSellingProductsAsync(limit, dateFrom, dateTo);
        return Ok(list.Select(x => new TopSellingProductDto
        {
            ProductId = x.ProductId,
            ProductName = x.ProductName,
            TotalQuantitySold = x.TotalQuantitySold,
            TotalRevenue = x.TotalRevenue
        }).ToList());
    }

    /// <summary>
    /// PATCH api/AdminOrders/5/Status - update order status (e.g. Processing, Shipped, Delivered, Cancelled)
    /// </summary>
    [HttpPatch("{id:int}/Status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _orderRepo.GetOrderByIdForUpdateAsync(id);
        if (order == null)
            return NotFound();
        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var status))
            return BadRequest("Invalid status. Use: Pending, PaymentReceived, PaymentFailed, Processing, Shipped, Delivered, Cancelled, Refunded.");
        order.Status = status;
        await _orderRepo.UpdateOrder(order);
        return Ok(new { orderId = id, status = order.Status.ToString() });
    }

    private static OrderListDto MapToListDto(Order o)
    {
        var total = (o.Subtotal ?? 0) + (o.DeliveryMethod?.Price ?? 0);
        var itemCount = o.OrderItems?.Count ?? 0;
        return new OrderListDto
        {
            OrderId = o.OrderId,
            BuyerEmail = o.BuyerEmail ?? "",
            OrderDate = o.OrderDate,
            Status = o.Status.ToString(),
            PaymentFailureReason = o.PaymentFailureReason,
            Total = total,
            ItemCount = itemCount
        };
    }

    private static OrderDetailDto MapToDetailDto(Order o)
    {
        var deliveryPrice = o.DeliveryMethod?.Price ?? 0;
        var subtotal = o.Subtotal ?? 0;
        var addr = o.ShipToAddress;
        return new OrderDetailDto
        {
            OrderId = o.OrderId,
            BuyerEmail = o.BuyerEmail ?? "",
            OrderDate = o.OrderDate,
            Status = o.Status.ToString(),
            PaymentIntentId = o.PaymentIntentId,
            PaymentFailureReason = o.PaymentFailureReason,
            Subtotal = subtotal,
            DeliveryCost = deliveryPrice,
            Total = subtotal + deliveryPrice,
            ShipToAddress = addr == null ? null : new OrderDetailAddressDto
            {
                FirstName = addr.FirstName,
                LastName = addr.LastName,
                Street = addr.Street,
                City = addr.City,
                State = addr.State,
                ZipCode = addr.ZipCode
            },
            DeliveryMethod = o.DeliveryMethod?.ShortName,
            Items = (o.OrderItems ?? new List<OrderItem>()).Select(oi => new OrderDetailItemDto
            {
                OrderItemId = oi.OrderItemId,
                ProductId = oi.ItemOrderd?.ProductItemId ?? 0,
                ProductName = oi.ItemOrderd?.ProductName ?? "",
                Price = oi.Price ?? 0,
                Quantity = oi.Quantity,
                LineTotal = (oi.Price ?? 0) * oi.Quantity
            }).ToList()
        };
    }
}

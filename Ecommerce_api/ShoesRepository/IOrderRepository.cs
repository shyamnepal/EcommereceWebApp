using DataAcess.Entity.OrderAggregate;
using DataAcess.ViewModel;
using ShoesShared.ModelDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoesRepository
{
    public interface IOrderRepository
    {
        Task<OrderResponseDto> CreateOrderAsync(string buyerEmail, int deliveryMethod, string basketId,
            Address shippingAddress);
        Task<OrderResponseDto> CreateOrderFromItemsAsync(string buyerEmail, int deliveryMethodId,
            Address shippingAddress, IReadOnlyList<OrderItemInput> items);
        Task<IReadOnlyList<Order>> GetOrderForUserAsync(string buyerEmail);
        Task<Order> GetOrderByIdAsync(int id, string buyerEmail);
        Task<IReadOnlyList<DeliveryMethod>> GetDeliveryMethodsAsync();
        /// <summary>Returns the shipping address from the user's most recent order, or null if none.</summary>
        Task<Address?> GetLastShippingAddressForUserAsync(string buyerEmail);
        Task<Order> GetOrderByPaymentIntentId(string paymentIntentId);
        Task<Order> UpdateOrder(Order order);

        /// <summary>Admin: paged orders with optional date and status filters.</summary>
        Task<(IReadOnlyList<Order> Orders, int TotalCount)> GetOrdersPagedAsync(DateTime? dateFrom, DateTime? dateTo, OrderStatus? status, int page, int pageSize);
        /// <summary>Admin: single order with items and address for detail view.</summary>
        Task<Order?> GetOrderByIdForAdminAsync(int orderId);
        /// <summary>Admin: get order for update (tracked).</summary>
        Task<Order?> GetOrderByIdForUpdateAsync(int orderId);
        Task<DashboardSummaryResult> GetDashboardSummaryAsync();
        Task<IReadOnlyList<RevenueByDateResult>> GetRevenueByDateAsync(DateTime dateFrom, DateTime dateTo);
        Task<IReadOnlyList<TopSellingResult>> GetTopSellingProductsAsync(int limit, DateTime? dateFrom, DateTime? dateTo);
    }
}

using DataAcess.Entity;
using DataAcess.Entity.OrderAggregate;
using DataAcess.ViewModel;
using Microsoft.EntityFrameworkCore;
using ShoesRepository.GenreicRepo;
using ShoesShared.ModelDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace ShoesRepository
{
    public class OrderRepository : IOrderRepository
    {
        private readonly IBasketRepository _basketRepo;
        private readonly IGenericRepository<Product> _productRepo;
        private readonly IGenericRepository<DeliveryMethod> _deliveryRepo;
        private readonly IGenericRepository<Order> _orderRepo;
        private readonly IGenericRepository<Address> _addressRepo;
        private readonly IPaymentRepository _paymentService;
        private readonly ShoesEcommerceContext _context;

        public OrderRepository(
            IBasketRepository basketRepo,
            IGenericRepository<Product> ProductRepo,
            IGenericRepository<DeliveryMethod> deliveryRepo,
            IGenericRepository<Order> orderRepo,
            IPaymentRepository paymentService,
            IGenericRepository<Address> addressRepo,
            ShoesEcommerceContext context
            )
        {
            _basketRepo = basketRepo;
            _productRepo = ProductRepo;
            _deliveryRepo = deliveryRepo;
            _orderRepo = orderRepo;
            _paymentService = paymentService;
            _addressRepo = addressRepo;
            _context = context;
        }

        public async Task<OrderResponseDto> CreateOrderAsync(
            string buyerEmail,
            int deliveryMethodId,
            string basketId,
            Address shippingAddress)
        {
            var orderResponseDto = new OrderResponseDto();
            // 1. Load basket
            var basket = await _basketRepo.GetBasketAsync(basketId)
                ?? throw new ArgumentException($"Basket '{basketId}' not found.");

            // 2. Map to OrderItems
            var items = new List<OrderItem>();
            foreach (var bi in basket.Items)
            {
                var p = await _productRepo.GetByIdAsync(bi.BasketItemId)
                    ?? throw new KeyNotFoundException($"Product {bi.BasketItemId} not found.");
                items.Add(new OrderItem(
                    new ProductItemOrdered(p.ProductId, p.ProductName, p.ProductImages),
                    p.Price,
                    bi.Quantity));
            }

            // 3. Lookup delivery
            var deliveryMethod = await _deliveryRepo.GetByIdAsync(deliveryMethodId)
                ?? throw new KeyNotFoundException($"Delivery method {deliveryMethodId} not found.");

            // 4. Calculate subtotal
            var subtotal = items.Sum(x => x.Price * x.Quantity);

            // ✅ Ensure the address is added to the database
            shippingAddress.AddressId = 0; // ✅ Reset ID to trigger auto-generation
            await _addressRepo.Add(shippingAddress);


            // ✅ Step: create payment intent with order total (Stripe amount in cents)
            var subtotalValue = subtotal ?? 0;
            var amountCents = (long)Math.Round(subtotalValue * 100);
            var paymentIntentDto = await _paymentService.CreateOrUpdatePaymentIntent(basketId, amountCents);

            // Create the order with the intent ID
            var order = new Order(items, buyerEmail, shippingAddress, deliveryMethod, subtotal)
            {
                PaymentIntentId = paymentIntentDto.Id,
                Status = OrderStatus.Pending
            };

            await _orderRepo.Add(order);
            orderResponseDto.OrderId = order.OrderId;
            orderResponseDto.ClientSecret = paymentIntentDto.ClientSecret;
            orderResponseDto.PaymentIntentId = order.PaymentIntentId;
            orderResponseDto.Status = order.Status.ToString();
            return orderResponseDto;
        }

        /// <summary>
        /// Create order from cart items (e.g. from localStorage). No Redis required.
        /// </summary>
        public async Task<OrderResponseDto> CreateOrderFromItemsAsync(
            string buyerEmail,
            int deliveryMethodId,
            Address shippingAddress,
            IReadOnlyList<OrderItemInput> inputItems)
        {
            var orderResponseDto = new OrderResponseDto();
            if (inputItems == null || inputItems.Count == 0)
                throw new ArgumentException("At least one item is required.");

            var items = new List<OrderItem>();
            foreach (var i in inputItems)
            {
                var p = await _productRepo.GetByIdAsync(i.ProductId)
                    ?? throw new KeyNotFoundException($"Product {i.ProductId} not found.");
                items.Add(new OrderItem(
                    new ProductItemOrdered(p.ProductId, p.ProductName, p.ProductImages),
                    i.Price,
                    i.Quantity));
            }

            var deliveryMethod = await _deliveryRepo.GetByIdAsync(deliveryMethodId)
                ?? throw new KeyNotFoundException($"Delivery method {deliveryMethodId} not found.");

            var subtotal = items.Sum(x => x.Price * x.Quantity);
            var subtotalValue = subtotal ?? 0;
            shippingAddress.AddressId = 0;
            await _addressRepo.Add(shippingAddress);

            var amountCents = (long)Math.Round(subtotalValue * 100);
            var paymentIntentDto = await _paymentService.CreateOrUpdatePaymentIntent("cart", amountCents);

            var order = new Order(items, buyerEmail, shippingAddress, deliveryMethod, subtotal)
            {
                PaymentIntentId = paymentIntentDto.Id,
                Status = OrderStatus.Pending
            };
            await _orderRepo.Add(order);
            orderResponseDto.OrderId = order.OrderId;
            orderResponseDto.ClientSecret = paymentIntentDto.ClientSecret;
            orderResponseDto.PaymentIntentId = order.PaymentIntentId;
            orderResponseDto.Status = order.Status.ToString();
            return orderResponseDto;
        }

        public async Task<IReadOnlyList<DeliveryMethod>> GetDeliveryMethodsAsync()
        {
            var list = _deliveryRepo.GetAll().ToList();
            return await Task.FromResult(list);
        }

        public async Task<Address?> GetLastShippingAddressForUserAsync(string buyerEmail)
        {
            if (string.IsNullOrWhiteSpace(buyerEmail)) return null;
            var order = await _context.Orders
                .AsNoTracking()
                .Where(o => o.BuyerEmail == buyerEmail)
                .OrderByDescending(o => o.OrderDate)
                .FirstOrDefaultAsync();
            return order?.ShipToAddress;
        }

        public Task<Order> GetOrderByIdAsync(int id, string buyerEmail)
        {
            throw new NotImplementedException();
        }

        public async Task<Order> GetOrderByPaymentIntentId(string paymentIntentId)
        {
            var list = _orderRepo.Find(o => o.PaymentIntentId == paymentIntentId, o => o.DeliveryMethod, o => o.OrderItems);
            return await Task.FromResult(list.FirstOrDefault());
        }

        public Task<IReadOnlyList<Order>> GetOrderForUserAsync(string buyerEmail)
        {
            throw new NotImplementedException();
        }

        public async Task<Order> UpdateOrder(Order order)
        {
            _orderRepo.Update(order);
            return await Task.FromResult(order);
        }

        public async Task<(IReadOnlyList<Order> Orders, int TotalCount)> GetOrdersPagedAsync(DateTime? dateFrom, DateTime? dateTo, OrderStatus? status, int page, int pageSize)
        {
            pageSize = Math.Clamp(pageSize, 1, 100);
            var query = _context.Orders
                .Include(o => o.DeliveryMethod)
                .Include(o => o.OrderItems)
                .AsNoTracking();

            if (dateFrom.HasValue)
                query = query.Where(o => o.OrderDate >= dateFrom.Value);
            if (dateTo.HasValue)
            {
                var to = dateTo.Value.Date.AddDays(1);
                query = query.Where(o => o.OrderDate < to);
            }
            if (status.HasValue)
                query = query.Where(o => o.Status == status.Value);

            var totalCount = await query.CountAsync();
            var orders = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return (orders, totalCount);
        }

        public async Task<Order?> GetOrderByIdForAdminAsync(int orderId)
        {
            return await _context.Orders
                .AsNoTracking()
                .Include(o => o.DeliveryMethod)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
        }

        public async Task<Order?> GetOrderByIdForUpdateAsync(int orderId)
        {
            return await _context.Orders
                .Include(o => o.DeliveryMethod)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
        }

        private static decimal GetOrderTotal(Order o)
        {
            var sub = o.Subtotal ?? 0;
            var delivery = o.DeliveryMethod?.Price ?? 0;
            return sub + delivery;
        }

        public async Task<DashboardSummaryResult> GetDashboardSummaryAsync()
        {
            var paid = OrderStatus.PaymentReceived;
            var now = DateTime.UtcNow;
            var todayStart = now.Date;
            var weekStart = todayStart.AddDays(-(int)now.DayOfWeek);
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var ordersQuery = _context.Orders.Include(o => o.DeliveryMethod).Where(o => o.Status == paid);

            var totalRevenue = await ordersQuery.SumAsync(o => (o.Subtotal ?? 0) + (o.DeliveryMethod != null ? o.DeliveryMethod.Price : 0));
            var totalOrders = await _context.Orders.CountAsync();

            var revenueToday = await ordersQuery.Where(o => o.OrderDate >= todayStart).SumAsync(o => (o.Subtotal ?? 0) + (o.DeliveryMethod != null ? o.DeliveryMethod.Price : 0));
            var revenueThisWeek = await ordersQuery.Where(o => o.OrderDate >= weekStart).SumAsync(o => (o.Subtotal ?? 0) + (o.DeliveryMethod != null ? o.DeliveryMethod.Price : 0));
            var revenueThisMonth = await ordersQuery.Where(o => o.OrderDate >= monthStart).SumAsync(o => (o.Subtotal ?? 0) + (o.DeliveryMethod != null ? o.DeliveryMethod.Price : 0));

            var ordersToday = await _context.Orders.CountAsync(o => o.OrderDate >= todayStart);
            var ordersThisWeek = await _context.Orders.CountAsync(o => o.OrderDate >= weekStart);
            var ordersThisMonth = await _context.Orders.CountAsync(o => o.OrderDate >= monthStart);

            return new DashboardSummaryResult
            {
                TotalRevenue = totalRevenue,
                TotalOrders = totalOrders,
                RevenueToday = revenueToday,
                RevenueThisWeek = revenueThisWeek,
                RevenueThisMonth = revenueThisMonth,
                OrdersToday = ordersToday,
                OrdersThisWeek = ordersThisWeek,
                OrdersThisMonth = ordersThisMonth
            };
        }

        public async Task<IReadOnlyList<RevenueByDateResult>> GetRevenueByDateAsync(DateTime dateFrom, DateTime dateTo)
        {
            var paid = OrderStatus.PaymentReceived;
            var list = await _context.Orders
                .Include(o => o.DeliveryMethod)
                .Where(o => o.Status == paid && o.OrderDate >= dateFrom && o.OrderDate < dateTo.AddDays(1))
                .GroupBy(o => o.OrderDate.Date)
                .Select(g => new RevenueByDateResult
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => (o.Subtotal ?? 0) + (o.DeliveryMethod != null ? o.DeliveryMethod.Price : 0)),
                    OrderCount = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync();
            return list;
        }

        public async Task<IReadOnlyList<TopSellingResult>> GetTopSellingProductsAsync(int limit, DateTime? dateFrom, DateTime? dateTo)
        {
            var paid = OrderStatus.PaymentReceived;
            var query = _context.Orders
                .Include(o => o.OrderItems)
                .Where(o => o.Status == paid);

            if (dateFrom.HasValue)
                query = query.Where(o => o.OrderDate >= dateFrom.Value);
            if (dateTo.HasValue)
                query = query.Where(o => o.OrderDate < dateTo.Value.AddDays(1));

            var orders = await query.ToListAsync();
            var items = orders.SelectMany(o => (IEnumerable<OrderItem>)(o.OrderItems ?? new List<OrderItem>())).ToList();
            var grouped = items
                .GroupBy(oi => new { Id = oi.ItemOrderd?.ProductItemId ?? 0, Name = oi.ItemOrderd?.ProductName ?? "Unknown" })
                .Where(g => g.Key.Id > 0)
                .Select(g => new TopSellingResult
                {
                    ProductId = g.Key.Id,
                    ProductName = g.Key.Name,
                    TotalQuantitySold = g.Sum(x => x.Quantity),
                    TotalRevenue = g.Sum(x => (x.Price ?? 0) * x.Quantity)
                })
                .OrderByDescending(x => x.TotalQuantitySold)
                .Take(Math.Clamp(limit, 1, 50))
                .ToList();
            return grouped;
        }
    }
}
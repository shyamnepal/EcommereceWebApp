using AutoMapper;
using DataAcess.Entity;
using DataAcess.Entity.OrderAggregate;
using Ecommerce_shoes.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShoesRepository;
using ShoesShared.ModelDto;
using ShoesShared.ShopesResponse;
using System.Security.Claims;

namespace Ecommerce_shoes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IMapper _mapper;
        private readonly IConfiguration _config;
        public OrderController(IOrderRepository orderRepository, IMapper mapper, IConfiguration config)
        {
            _orderRepository = orderRepository;
            _mapper = mapper;
            _config = config;   

        }
        [HttpPost("CreateOrder")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderDto orderDto)
        {
            var response = new ShoesResponse();
            var email = ClaimsPrincipalExtensions.RetrieveEmailFromPrincipal(User) ?? orderDto.BuyerEmail ?? "guest@checkout.local";
            if (orderDto.ShipToAddress == null)
            {
                response.Message = "Shipping address is required.";
                return BadRequest(response);
            }
            var address = _mapper.Map<Address>(orderDto.ShipToAddress);

            OrderResponseDto order;
            if (orderDto.Items != null && orderDto.Items.Count > 0)
            {
                // Create order from cart items (no Redis needed – cart from localStorage)
                order = await _orderRepository.CreateOrderFromItemsAsync(email, orderDto.DeliverMethodId, address, orderDto.Items);
            }
            else
            {
                // Create order from basket in Redis
                order = await _orderRepository.CreateOrderAsync(email, orderDto.DeliverMethodId, orderDto.BasketId, address);
            }

            response.Message = "Problem creating order";
            response.Status = _config["Response:FailedStatus"];
            response.ErrorCode = int.Parse(_config["Response:ErrorCode"]);
            if (order == null) return BadRequest(response);
            response.Data = order;
            response.Status = _config["Response:SuccessStatus"];
            response.ErrorCode = int.Parse(_config["Response:SuccessCode"]);
            response.Message = "Successfully ordered the product";
            return Ok(order);
        }

        [HttpGet("DeliveryMethods")]
        public async Task<IActionResult> GetDeliveryMethods()
        {
            var methods = await _orderRepository.GetDeliveryMethodsAsync();
            return Ok(methods);
        }

        /// <summary>
        /// GET api/Order/LastShippingAddress - Returns the shipping address from the current user's most recent order.
        /// If the user has no orders, returns 204 No Content. Use to pre-fill checkout when address is already saved.
        /// </summary>
        [HttpGet("LastShippingAddress")]
        [Authorize]
        public async Task<IActionResult> GetLastShippingAddress()
        {
            var email = ClaimsPrincipalExtensions.RetrieveEmailFromPrincipal(User);
            if (string.IsNullOrWhiteSpace(email))
                return Unauthorized();
            var address = await _orderRepository.GetLastShippingAddressForUserAsync(email);
            if (address == null)
                return NoContent();
            return Ok(new
            {
                firstName = address.FirstName,
                lastName = address.LastName,
                street = address.Street,
                city = address.City,
                state = address.State,
                zipCode = address.ZipCode
            });
        }
    }
}

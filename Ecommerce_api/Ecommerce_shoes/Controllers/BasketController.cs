using DataAcess.Entity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShoesRepository;


namespace Ecommerce_shoes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class BasketController : ControllerBase
    {
        private readonly IBasketRepository _basketRepository;
        public BasketController(IBasketRepository basketRepository)
        {
            _basketRepository = basketRepository;
        }
        [HttpGet]
        public async Task<ActionResult<CustomerBasket>> GetBasket(String id)
        {
            var basket = await _basketRepository.GetBasketAsync(id);
            return Ok(basket ?? new CustomerBasket(id));
        }

        [HttpPost]
        public async Task<ActionResult<CustomerBasket>> UpdateBasket(CustomerBasket basket)
        {
            var updateBasket = await _basketRepository.UpdateBasketAsync(basket);
            return Ok(updateBasket);
        }

        [HttpDelete]
        public async Task DeleteBasketAsync(string id)
        {
            await _basketRepository.DeleteBasketAsync(id);
        }
    }
}

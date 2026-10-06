using DataAcess.Entity;
using DataAcess.Entity.OrderAggregate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShoesRepository;
using Stripe;

namespace Ecommerce_shoes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly ShoesEcommerceContext _context;

        public PaymentsController(IConfiguration config, ShoesEcommerceContext context)
        {
            _config = config;
            _context = context;
        }

        [HttpGet("PublishableKey")]
        [AllowAnonymous]
        public IActionResult GetPublishableKey()
        {
            var key = _config["Stripe:PublishableKey"];
            return Ok(new { publishableKey = key ?? "" });
        }

        /// <summary>
        /// Call this after Stripe confirmCardPayment succeeds so the order status is set to PaymentReceived immediately
        /// (webhook also updates it, but this works when webhook is not reachable e.g. local dev).
        /// </summary>
        [HttpPost("ConfirmPayment")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.PaymentIntentId))
                return BadRequest(new { message = "PaymentIntentId is required." });

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.PaymentIntentId == request.PaymentIntentId.Trim());
            if (order == null)
                return NotFound(new { message = "Order not found for this payment." });

            order.Status = OrderStatus.PaymentReceived;
            await _context.SaveChangesAsync();

            return Ok(new { orderId = order.OrderId, status = order.Status.ToString() });
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> StripeWebhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

            var stripeSignature = Request.Headers["Stripe-Signature"];
            var webhookSecret = _config["Stripe:WebhookSecret"];

            Event stripeEvent;

            try
            {
                stripeEvent = EventUtility.ConstructEvent(
                    json,
                    stripeSignature,
                    webhookSecret
                );
            }
            catch (Exception ex)
            {
                return BadRequest($"Webhook error: {ex.Message}");
            }

            if (stripeEvent.Type == "payment_intent.succeeded")
            {
                var intent = stripeEvent.Data.Object as PaymentIntent;
                var paymentIntentId = intent?.Id;
                if (!string.IsNullOrEmpty(paymentIntentId))
                {
                    var order = await _context.Orders
                        .FirstOrDefaultAsync(o => o.PaymentIntentId == paymentIntentId);
                    if (order != null)
                    {
                        order.Status = OrderStatus.PaymentReceived;
                        await _context.SaveChangesAsync();
                    }
                }
            }
            else if (stripeEvent.Type == "payment_intent.payment_failed")
            {
                var intent = stripeEvent.Data.Object as PaymentIntent;
                var paymentIntentId = intent?.Id;
                if (!string.IsNullOrEmpty(paymentIntentId))
                {
                    var order = await _context.Orders
                        .FirstOrDefaultAsync(o => o.PaymentIntentId == paymentIntentId);
                    if (order != null)
                    {
                        order.Status = OrderStatus.PaymentFailed;
                        // Store why payment failed (Stripe decline code / message) so admin can see reason
                        var err = intent?.LastPaymentError;
                        if (err != null)
                        {
                            var code = err.Code ?? "";
                            var declineCode = err.DeclineCode ?? "";
                            var msg = err.Message ?? "";
                            if (!string.IsNullOrEmpty(declineCode))
                                order.PaymentFailureReason = declineCode + (string.IsNullOrEmpty(msg) ? "" : ": " + msg);
                            else if (!string.IsNullOrEmpty(code))
                                order.PaymentFailureReason = code + (string.IsNullOrEmpty(msg) ? "" : ": " + msg);
                            else if (!string.IsNullOrEmpty(msg))
                                order.PaymentFailureReason = msg;
                        }
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return Ok();
        }
    }

    public class ConfirmPaymentRequest
    {
        public string PaymentIntentId { get; set; } = string.Empty;
    }
}

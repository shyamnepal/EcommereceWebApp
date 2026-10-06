using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoesShared.ModelDto
{
    public class OrderResponseDto
    {
        public int OrderId { get; set; }
        public string PaymentIntentId { get; set; }
        public string ClientSecret { get; set; }
        /// <summary>Order status as readable string: Pending, PaymentReceived, PaymentFailed.</summary>
        public string Status { get; set; } = string.Empty;
    }
}

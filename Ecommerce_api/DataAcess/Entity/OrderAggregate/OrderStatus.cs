using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace DataAcess.Entity.OrderAggregate
{
    public enum OrderStatus
    {
        [EnumMember(Value = "Pending")]
        Pending,
        [EnumMember(Value = "PaymentReceived")]
        PaymentReceived, // Paid
        [EnumMember(Value = "PaymentFailed")]
        PaymentFailed,
        [EnumMember(Value = "Processing")]
        Processing,
        [EnumMember(Value = "Shipped")]
        Shipped,
        [EnumMember(Value = "Delivered")]
        Delivered,
        [EnumMember(Value = "Cancelled")]
        Cancelled,
        [EnumMember(Value = "Refunded")]
        Refunded,
    }
}

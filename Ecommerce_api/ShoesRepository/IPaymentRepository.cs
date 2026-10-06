using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShoesShared.ModelDto;

namespace ShoesRepository
{
    public interface IPaymentRepository
    {
        Task<PaymentIntentDto> CreateOrUpdatePaymentIntent(string basketId, long amountInCents);
    }
}

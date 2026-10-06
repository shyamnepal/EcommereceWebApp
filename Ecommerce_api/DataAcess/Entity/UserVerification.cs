using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAcess.Entity
{
    public class UserVerification
    {
         public int Id { get; set; }
    public string UserId { get; set; }
    public string VerificationCode { get; set; }
    public bool IsVerified { get; set; }
    public DateTime VerificationCodeExpiration { get; set; }

    public User User { get; set; }
    }
}

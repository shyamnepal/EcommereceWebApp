using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoesShared.MailServics
{
    public interface IMailServices
    {
        bool SendMail(string userEmail, string verificationCode);
    }
}

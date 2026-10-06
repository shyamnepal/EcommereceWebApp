using DataAcess.ViewModel;
using ShoesShared.ShopesResponse;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace shoesServices
{
    public interface IAccountServices
    {
        Task<ShoesResponse> UserRegister(UserViewModel model, string role);
        Task<ShoesResponse> Login(LoginUserViewModel model);
        Task<ShoesResponse> VerifyAccount(string UserId, string verificationCode);
        void ForgetPassword(string email, string resetUrl);
    }
}

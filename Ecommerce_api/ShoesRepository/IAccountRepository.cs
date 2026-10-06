
using DataAcess.ViewModel;
using ShoesShared.ShopesResponse;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoesRepository
{
    public interface IAccountRepository
    {
        Task<ShoesResponse> UserRegister(UserViewModel model, string role);
        Task<ShoesResponse> Login(LoginUserViewModel model);
        Task<ShoesResponse> VerifyAccount(string userId, string verificationCode);
        void ForgetPassword(string email, string resetUrl);
    }
}

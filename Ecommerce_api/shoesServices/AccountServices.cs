using Azure;
using DataAcess.ViewModel;
using Microsoft.Extensions.Logging;
using ShoesRepository;
using ShoesShared.ShopesResponse;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
 

namespace shoesServices
{
    public class AccountServices : IAccountServices
    {
        private readonly IAccountRepository _accountRepository;
        private ILogger<AccountServices> _logger;
        public AccountServices(IAccountRepository accountRepository,ILogger<AccountServices> logger)
        {
            _accountRepository = accountRepository;
            _logger = logger;
        }

        public void ForgetPassword(string email, string resetUrl)
        {
            _accountRepository.ForgetPassword(email, resetUrl);
        }

        public async Task<ShoesResponse> Login(LoginUserViewModel model)
        {
            var response = new ShoesResponse();
            if (string.IsNullOrWhiteSpace(model.UserName) && string.IsNullOrWhiteSpace(model.Password))
            {
                response.Message = "UserName or Password is empty";
                response.Status = "Failde";
                response.ErrorCode = 0;
                _logger.LogWarning("Username or Password is empty");
                return response;
            }
            return await _accountRepository.Login(model);
            //return await _accountRepository

        }

        public async Task<ShoesResponse> UserRegister(UserViewModel model, string role)
        {
            
            return await _accountRepository.UserRegister(model, role);
        }

        public async Task<ShoesResponse> VerifyAccount(string UserId, string verificationCode)
        {
            //if (UserId == null || verificationCode == null)
            //{
            //    response.Errormessage = "User field or role is empty";
            //    response.ErrorCode = 1;
            //    response.Status = "failed";
            //    return response; 
            //}
            return await _accountRepository.VerifyAccount(UserId, verificationCode);
        }
    }
}

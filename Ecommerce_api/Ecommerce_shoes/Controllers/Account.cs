using DataAcess.Entity;
using DataAcess.ViewModel;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using ShoesRepository;
using shoesServices;
using ShoesShared.ShopesResponse;
using System.Text;
using System.Web;

namespace Ecommerce_shoes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Account : ControllerBase
    {

        private readonly IAccountServices _acountService;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<Account> _logger;
        private readonly IConfiguration _config;
        public Account(IAccountServices accountService, UserManager<User> userManager, ILogger<Account> logger, IConfiguration config)
        {
            _acountService = accountService;
            _userManager = userManager;
            _logger = logger;
            _config = config;
        }
        [HttpPost("UserRegister")]
        public async Task<IActionResult> UserRegister(UserViewModel model)
        {
            if(!ModelState.IsValid) 
            {
               
                var errorResponse = new ShoesResponse();
                errorResponse.Status = "Failed";
                errorResponse.Message = "Validation error";
                _logger.LogWarning("invalid user model");
                return BadRequest(errorResponse);

            }
            // Normal signup → role "User" → JWT will contain role "User"
            var response = await _acountService.UserRegister(model, "User");
            return Ok(response);
        }

        /// <summary>
        /// Register an admin. Requires AdminRegisterSecret in body (must match appsettings "AdminRegister:Secret").
        /// Admins get JWT with role "Admin"; normal users get JWT with role "User".
        /// </summary>
        [HttpPost("AdminRegister")]
        public async Task<IActionResult> AdminRegister([FromBody] AdminRegisterRequest request)
        {
            if (request?.User == null || !ModelState.IsValid)
            {
                return BadRequest(new ShoesResponse { Status = "Failed", Message = "Invalid request." });
            }
            var secret = _config["AdminRegister:Secret"];
            if (string.IsNullOrEmpty(secret) || request.Secret != secret)
            {
                return Unauthorized(new ShoesResponse { Status = "Failed", Message = "Invalid or missing admin secret." });
            }
            var response = await _acountService.UserRegister(request.User, "Admin");
            return Ok(response);
        }

        [HttpPost]
        [Route("Login")]
        public async Task<IActionResult> Login(LoginUserViewModel model)
        {
            var response =new ShoesResponse();
            try
            {
                response = await _acountService.Login(model);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "An error occurred while login the applicaiton");
            }         
             
            return Ok(response);
        }
        [HttpPost("VerifyAccount")]
        public async Task<IActionResult> VerifyAccount(VerificaitonViewModel model)
        {
            if (!ModelState.IsValid)
            {
                var errorResponse = new ShoesResponse();
                errorResponse.Status = "Failed";
                errorResponse.Message = "Validation error";
                return BadRequest(errorResponse);
            }
            var response = await _acountService.VerifyAccount(model.UserId, model.verificationCode);
            return Ok(response);

        }
        [HttpPost("forget-password")]
        public async Task<IActionResult> ForgetPassword(ForgetPasswordViewModel forgetPasswordModel)
        {
            var errorResponse = new ShoesResponse();
            if (!ModelState.IsValid)
            {
                errorResponse.Status = "Failed";
                errorResponse.Message = "please enter email";
                return BadRequest(errorResponse);
            }
            var user = await _userManager.FindByEmailAsync(forgetPasswordModel.Email);
            if(user == null)
            {
                errorResponse.Status = "Failed";
                errorResponse.Message = "email is invalid";
                return BadRequest(errorResponse); 
            }
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedtoken = Convert.ToBase64String(Encoding.UTF8.GetBytes(token));
            var baseUrl = _config["ClientBaseUrl"];
            var resetPasswordPath = $"/reset-password?token={encodedtoken}&email={user.Email}";
            var resetUrl = new Uri(new Uri(baseUrl), resetPasswordPath).ToString();
            //var resetUrl = Url.Action("ResetPassword","Account" , new { token, email = user.Email }, Request.Scheme,host: "http://localhost:5173/");
            _acountService.ForgetPassword(forgetPasswordModel.Email, resetUrl);
            errorResponse.Status = _config["Response:SuccessStatus"];
            errorResponse.Message = "reset link is sent to your email";
            errorResponse.ErrorCode = int.Parse(_config["Response:SuccessCode"]);

            return Ok(errorResponse);
        }
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            var errorResponse = new ShoesResponse();
            if (!ModelState.IsValid)
            {
                errorResponse.Status = "Failed";
                errorResponse.Message = "please fill the form";
                return BadRequest(errorResponse);
            }
            var user = await _userManager.FindByEmailAsync(model.Email);
            if(user == null )
            {
                errorResponse.Status = "Failed";
                errorResponse.Message = "User not found";
                return BadRequest(errorResponse);
            }
            // Decode the token
            // Decode the token from Base64 (do not URL decode here)
            var decodedBytes = Convert.FromBase64String(model.Token);
            var decodedToken = Encoding.UTF8.GetString(decodedBytes);
            var resetpassword= await _userManager.ResetPasswordAsync(user, decodedToken, model.NewPassword);
            if (!resetpassword.Succeeded)
            {
                errorResponse.Status = "Failed";
                errorResponse.Message = "Failed reset password";
                return BadRequest(errorResponse);
            }
            errorResponse.Status = "success";
            errorResponse.Message = "Successfully reset password";
            errorResponse.ErrorCode = int.Parse(_config["Response:SuccessCode"]);
            return Ok(errorResponse);

        }
    }
}

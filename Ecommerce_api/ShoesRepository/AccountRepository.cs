
using Azure;
using Azure.Core;
using DataAcess.Entity;
using DataAcess.ViewModel;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Microsoft.VisualBasic;
using ShoesShared.MailServics;
using ShoesShared.ShopesResponse;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;
using JwtRegisteredClaimNames = Microsoft.IdentityModel.JsonWebTokens.JwtRegisteredClaimNames;

namespace ShoesRepository
{
    public class AccountRepository : IAccountRepository
    {
        private readonly UserManager<DataAcess.Entity.User> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ShoesEcommerceContext _dbContext;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly SignInManager<DataAcess.Entity.User> _signInManager;
        private readonly IConfiguration _config;
        private readonly IMailServices _sendMail;
        private readonly ILogger<AccountRepository> _logger;
        public AccountRepository(UserManager<DataAcess.Entity.User> userManager,
            IConfiguration configuration,
            ShoesEcommerceContext dbContext,
            RoleManager<IdentityRole> roleManger,
            SignInManager<DataAcess.Entity.User> signInManager,
            IConfiguration config,
            IMailServices sendMail,
            ILogger<AccountRepository> logger
            )
        {
            _userManager = userManager;
            _configuration = configuration;
            _dbContext = dbContext;
            _roleManager = roleManger;
            _signInManager = signInManager;
            _config = config;
            _sendMail = sendMail;
            _logger = logger;
        }

        public async Task<ShoesResponse> Login(LoginUserViewModel model)
        {
            var response = new ShoesResponse();
            try
            {
                var checkUser = await _userManager.FindByNameAsync(model.UserName);
                if (checkUser == null)
                {
                    response.Message = "User not found";
                    response.Status = _config["Response:FailedStatus"];
                    response.ErrorCode = int.Parse(_config["Response:ErrorCode"]);
                    _logger.LogWarning($"user is not found and the username is: {model.UserName}");

                    return response;
                }
                if (!await _userManager.IsEmailConfirmedAsync(checkUser))
                {
                    response.Message = "User is not veryfied";
                    response.Status = _config["Response:FailedStatus"];
                    response.ErrorCode = int.Parse(_config["Response:ErrorCode"]);
                    _logger.LogWarning($"User is not veryfied and user email is: {checkUser.Email}");
                    return response;
                }




                var result = await _userManager.CheckPasswordAsync(checkUser, model.Password);
                if (result)
                {
                    var roles = await _userManager.GetRolesAsync(checkUser);
                    var token = GenerateToken(checkUser);

                    response.Message = "Login sucessfully";
                    response.ErrorCode = int.Parse(_config["Response:SuccessCode"]);
                    response.Status = _config["Response:SuccessStatus"];
                    response.Token = token;
                    response.Data = new { userName = checkUser.UserName, roles };
                    return response;
                }
                response.Message = "Failed to login";
                response.ErrorCode = int.Parse(_config["Response:ErrorCode"]);
                response.Status = _config["Response:FailedStatus"];
                _logger.LogError($"failed to login the application at CheckPasswordAsync and username is {checkUser.UserName} ");
            }
            catch (Exception ex)
            {
                _logger.LogCritical($"error message: {ex.Message} stackTrace: {ex.StackTrace} innerexception: {ex.InnerException}");
            }

            return response;
        }

        public async Task<ShoesResponse> UserRegister(DataAcess.ViewModel.UserViewModel model, string role)
        {
            var response = new ShoesResponse();

            var userExists = await _userManager.FindByNameAsync(model.UserName);
            if (userExists != null)
            {
                _logger.LogWarning($"This user {userExists.UserName} is already exist");
                response.Message = "User Already Exists";
                response.ErrorCode = int.Parse(_config["Response:ErrorCode"]);
                response.Status = _config["Response:FailedStatus"];
                return response;
            }

            var emailExists = await _userManager.FindByEmailAsync(model.Email);
            if (emailExists != null)
            {
                _logger.LogWarning($"This Email {userExists.Email} is already exist");
                response.Message = "Email Already Exists";
                response.ErrorCode = int.Parse(_config["Response:ErrorCode"]);
                response.Status = _config["Response:FailedStatus"];
                return response;
            }

            var user = new DataAcess.Entity.User()
            {
                UserName = model.UserName,
                Email = model.Email,
                Address = model.Address,




            };

            //var passwordHash = _userManager.PasswordHasher.HashPassword(user, model.Password);
            //user.PasswordHash = passwordHash;

            using (var transaction = await _dbContext.Database.BeginTransactionAsync())
            {

                var createUserResult = await _userManager.CreateAsync(user, model.Password);

                if (!createUserResult.Succeeded)
                {
                    _logger.LogError($"User {user.UserName} is faild to create");
                    response.Status = _config["Response:FailedStatus"];
                    response.ErrorCode = int.Parse(_config["Response:ErrorCode"]);
                    // Return actual Identity errors to frontend (e.g. password too short, requirements)
                    var errors = createUserResult.Errors.Select(e => e.Description).ToList();
                    response.Message = errors.Count > 0
                        ? string.Join(" ", errors)
                        : "User creation failed. Check user details and try again.";
                    return response;
                }
                var verifyCode = GenerateVerificationCode();
                var verification = new UserVerification
                {
                    UserId = user.Id,
                    VerificationCode = verifyCode,
                    IsVerified = true,
                    VerificationCodeExpiration = DateTime.UtcNow.AddMinutes(30) // Set expiration time
                };
                // Save the verification code in the database. 
                _dbContext.UserVerifications.Add(verification);
                _dbContext.SaveChanges();

                // send verification code in email
                _sendMail.SendMail(user.Email, verifyCode);


                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new IdentityRole(role));
                }

                if (await _roleManager.RoleExistsAsync(role))
                {

                    await _userManager.AddToRoleAsync(user, role);
                }

                await transaction.CommitAsync();
                _logger.LogInformation($"Code is send to your email: {user.Email}");
                response.Message = "verify 6 digit code";
                response.ErrorCode = int.Parse(_config["Response:SuccessCode"]);
                response.Status = _config["Response:SuccessStatus"];
                response.Data = user.Id;
                return response;




            }



        }


        public string GenerateToken(DataAcess.Entity.User model)
        {
            if (model != null)
            {
                var issuer = _config["Jwt:Issuer"];
                var audience = _config["Jwt:Audience"];
                var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);
                var roles = _userManager.GetRolesAsync(model).Result;

                var claims = new List<Claim>
                {
                     new Claim("Id", model.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Sub, model.UserName),
                    new Claim(JwtRegisteredClaimNames.Email, model.Email),
                    //new Claim(JwtRegisteredClaimNames.PhoneNumber, model.PhoneNumber),
                };
                foreach (var role in roles)
                {
                    claims.Add(new Claim(ClaimTypes.Role, role));
                    claims.Add(new Claim("role", role));
                }
                var expiryMinutes = 120;
                if (int.TryParse(_config["Jwt:ExpiryMinutes"], out var configMinutes) && configMinutes > 0)
                    expiryMinutes = configMinutes;
                var tokenDescription = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
                    Issuer = issuer,
                    Audience = audience,
                    SigningCredentials = new SigningCredentials
                     (
                         new SymmetricSecurityKey(key),
                         SecurityAlgorithms.HmacSha512Signature
                         )
                };
                var tokenHandler = new JwtSecurityTokenHandler { MapInboundClaims = false };
                tokenHandler.OutboundClaimTypeMap = new Dictionary<string, string>();
                var token = tokenHandler.CreateToken(tokenDescription);
                var jwtToken = tokenHandler.WriteToken(token);
                return jwtToken;
            }
            return null;


        }

        private string GenerateVerificationCode()
        {
            Random random = new Random();
            int verificationCode = random.Next(100000, 999999);
            return verificationCode.ToString();
        }

        public async Task<ShoesResponse> VerifyAccount(string userId, string verificationCode)
        {
            var response = new ShoesResponse();
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User {user.UserName} is not found");
                    response.Message = "User not found";
                    response.Status = _config["Response:FailedStatus"];
                    response.ErrorCode = int.Parse(_config["Response:ErrorCode"]);
                    return response;
                }
                var verificaiton = _dbContext.UserVerifications
                    .Where(v => v.UserId == userId && v.VerificationCode == verificationCode)
                    .OrderByDescending(v => v.VerificationCodeExpiration)
                    .FirstOrDefault();
                if (verificaiton == null || verificaiton.VerificationCodeExpiration < DateTime.UtcNow)
                {
                    //verification code is invalid or expired
                    _logger.LogWarning($"Invalid verification code of user {user.UserName} code is {verificaiton}");
                    response.Message = "Invalid verification code";
                    response.Status = _config["Response:FailedStatus"];
                    response.ErrorCode = int.Parse(_config["Response:ErrorCode"]);
                    return response;
                }
                // update user's EmailConfirmed property
                user.EmailConfirmed = true;
                verificaiton.IsVerified = true;
                await _userManager.UpdateAsync(user);

                //return the verification is successful 
                response.Message = "Successfully verify the code";
                response.Status = _config["Response:SuccessStatus"];
                response.ErrorCode = int.Parse(_config["Response:SuccessCode"]);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Message: {ex.Message} InnerException: {ex.InnerException} StackTrace: {ex.StackTrace}");
            }

            return response;

        }

        public void ForgetPassword(string email, string resetUrl)
        {
            _sendMail.SendMail(email, resetUrl);
        }
    }
}

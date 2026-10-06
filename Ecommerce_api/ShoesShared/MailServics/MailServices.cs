using DataAcess.ViewModel;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace ShoesShared.MailServics
{
    public  class MailServices: IMailServices
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<MailServices> _logger;
        public MailServices(IConfiguration configuration,
            ILogger<MailServices> logger
            )
        {

            _configuration = configuration;
            _logger = logger;
        }

        public bool SendMail(string userEmail, string verificationCode)
        {


            var smtpClient = new SmtpClient(_configuration["SmtpSettings:SmtpServer"])
            {
                Port = int.Parse(_configuration["SmtpSettings:Port"]),
                Credentials = new NetworkCredential(_configuration["SmtpSettings:Username"], _configuration["SmtpSettings:Password"]),
                EnableSsl = bool.Parse(_configuration["SmtpSettings:EnableSsl"]),
            };

            var message = new MailMessage
            {
                From = new MailAddress(_configuration["SmtpSettings:Username"]),
                Subject = "Account Verification",
                Body = $"Your verification code is: {verificationCode}",
            };

            message.To.Add(userEmail); // Your email address to receive messages

            try
            {
                smtpClient.Send(message);

                //ViewBag.Message = "Your message has been sent successfully!";
            }
            catch (Exception ex)
            {
                _logger.LogError($"Message: {ex.Message} StackTrace: {ex.StackTrace} InnerException: {ex.InnerException}");
                return false;
            }


            //return View("Contact", model);
            return true;
        }
    }
}

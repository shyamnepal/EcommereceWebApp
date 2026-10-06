using System.Net;
using Newtonsoft.Json;
using ShoesShared.ShopesResponse;

namespace Ecommerce_shoes.Middleware
{
    public static class ExceptionMiddlewareExtensions
    {
        public static void ConfigureExceptionHandler(this IApplicationBuilder app, IConfiguration config)
        {
            app.Use(async (context, next) =>
            {
                try
                {
                    await next();
                }
                catch (Exception ex)
                {
                    var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
                        .CreateLogger("GlobalExceptionHandler");
                    logger.LogError(ex, "An unhandled exception occurred.");

                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    context.Response.ContentType = "application/json";

                    var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

                    var response = new ShoesResponse
                    {
                        Status = config["Response:SuccessStatus"],
                        Message = isDevelopment ? ex.Message : "An unexpected error occurred. Please contact support.",
                        ErrorCode = int.Parse(config["Response:ErrorCode"])
                    };

                    await context.Response.WriteAsync(JsonConvert.SerializeObject(response));
                }
            });
        }
    }
    
}

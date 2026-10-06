using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Ecommerce_shoes.Attribute;

public class ApiKeyAuthorizationFilter : IAsyncAuthorizationFilter
{
    private const string ApiKeyHeaderName = "X-API-KEY";
    private readonly IConfiguration _configuration;

    public ApiKeyAuthorizationFilter(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var apiKey = context.HttpContext.Request.Headers[ApiKeyHeaderName].FirstOrDefault();
        if (string.IsNullOrEmpty(apiKey))
            return Task.CompletedTask; // No key: let JWT or [Authorize] handle it

        var clients = _configuration.GetSection("ApiClients").GetChildren();
        foreach (var client in clients)
        {
            var key = client["Key"];
            var role = client["Role"];
            if (!string.IsNullOrEmpty(key) && key == apiKey && !string.IsNullOrEmpty(role))
            {
                var identity = new ClaimsIdentity("ApiKey");
                identity.AddClaim(new Claim(ClaimTypes.Name, "ApiClient"));
                identity.AddClaim(new Claim(ClaimTypes.Role, role));
                context.HttpContext.User = new ClaimsPrincipal(identity);
                return Task.CompletedTask;
            }
        }

        context.Result = new UnauthorizedObjectResult(new { message = "Invalid API key" });
        return Task.CompletedTask;
    }
}

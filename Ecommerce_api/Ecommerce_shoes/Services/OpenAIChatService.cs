using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using Microsoft.Extensions.Logging;

namespace Ecommerce_shoes.Services;

public class OpenAIChatService : IChatService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OpenAIChatService> _logger;
    private const string SystemPrompt = @"You are a helpful customer service assistant for SoleStore, an online shoe store. 
You help customers with: product questions, sizing, shipping, returns, and general inquiries about shoes and the store. 
Keep answers friendly, concise, and relevant. If you don't know something, suggest they contact support or browse the shop. 
Do not make up product names or prices; suggest they check the website.";

    public OpenAIChatService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<OpenAIChatService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string?> SendMessageAsync(string userMessage, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return "Chat is not configured. Please add OpenAI:ApiKey in appsettings.";

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + apiKey);

        var payload = new
        {
            model = _configuration["OpenAI:Model"] ?? "gpt-3.5-turbo",
            messages = new[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user", content = userMessage }
            },
            max_tokens = 300
        };

        const int maxAttempts = 2;
        try
        {
            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                var response = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", payload, JsonOptions, cancellationToken);

                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests && attempt < maxAttempts)
                {
                    var retryAfter = response.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(4);
                    _logger.LogWarning("OpenAI rate limit (429), retrying after {Seconds}s", retryAfter.TotalSeconds);
                    await Task.Delay(retryAfter, cancellationToken);
                    continue;
                }

                if (!response.IsSuccessStatusCode)
                {
                    var status = (int)response.StatusCode;
                    var body = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning("OpenAI API error {StatusCode}: {Body}", status, body);
                    if (status == 401)
                        return "Invalid OpenAI API key. Check OpenAI:ApiKey in appsettings and that the key is correct and active.";
                    if (status == 429)
                        return "Too many requests right now. Please wait a minute and try again.";
                    if (status >= 500)
                        return "OpenAI service is temporarily unavailable. Please try again later.";
                    return $"Assistant error ({status}). Try again or check your API key.";
                }

                var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
                var content = json.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                return content?.Trim();
            }

            return "Too many requests right now. Please wait a minute and try again.";
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "OpenAI request failed (network/connection)");
            return "Cannot reach the assistant (check internet connection and that api.openai.com is not blocked). Please try again later.";
        }
        catch (TaskCanceledException)
        {
            return "Request timed out. Please try again.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI chat error");
            return "Something went wrong. Please try again.";
        }
    }
}

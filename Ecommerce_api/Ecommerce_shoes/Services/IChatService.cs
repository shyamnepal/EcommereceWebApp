namespace Ecommerce_shoes.Services;

public interface IChatService
{
    Task<string?> SendMessageAsync(string userMessage, CancellationToken cancellationToken = default);
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ecommerce_shoes.Services;

namespace Ecommerce_shoes.Controllers;

[Route("api/[controller]")]
[ApiController]
[AllowAnonymous]
public class AIController : ControllerBase
{
    private readonly IChatService _chatService;

    public AIController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpPost("Chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request?.Message))
            return BadRequest(new { message = "Message is required." });

        var reply = await _chatService.SendMessageAsync(request.Message.Trim(), cancellationToken);
        return Ok(new { reply });
    }
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
}

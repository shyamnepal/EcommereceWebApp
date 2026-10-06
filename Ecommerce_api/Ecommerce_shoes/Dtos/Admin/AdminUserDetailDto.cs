namespace Ecommerce_shoes.Dtos.Admin;

public class AdminUserDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailConfirmed { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public bool IsLocked { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public List<string> Roles { get; set; } = new();
}


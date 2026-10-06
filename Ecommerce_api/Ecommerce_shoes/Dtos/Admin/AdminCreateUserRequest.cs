using System.ComponentModel.DataAnnotations;

namespace Ecommerce_shoes.Dtos.Admin;

public class AdminCreateUserRequest
{
    [Required]
    [MinLength(2)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public string? Address { get; set; }

    public List<string> Roles { get; set; } = new() { "User" };
}

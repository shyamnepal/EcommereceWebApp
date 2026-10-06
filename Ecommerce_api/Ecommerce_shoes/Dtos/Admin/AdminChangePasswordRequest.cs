using System.ComponentModel.DataAnnotations;

namespace Ecommerce_shoes.Dtos.Admin;

public class AdminChangePasswordRequest
{
    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

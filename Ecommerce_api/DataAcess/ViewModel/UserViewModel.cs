using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DataAcess.ViewModel;

public  class UserViewModel 
{
  
    [Required]
    public string UserName { get; set; } = null!;
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = null!;

    [Required]
    public string Email { get; set; } = null!;
    [Required]
    public string Address { get; set; } = null!;
}

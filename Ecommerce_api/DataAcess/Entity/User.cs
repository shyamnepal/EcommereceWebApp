using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace DataAcess.Entity;

public  class User : IdentityUser
{

    public string Address { get; set; }

    public UserVerification UsezrVerification { get; set; }
    public bool IsAdmin { get; set; }

}

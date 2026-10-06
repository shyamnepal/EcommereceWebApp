namespace DataAcess.ViewModel;

/// <summary>
/// Request body for AdminRegister. Secret must match appsettings "AdminRegister:Secret".
/// </summary>
public class AdminRegisterRequest
{
    public UserViewModel User { get; set; } = null!;
    public string Secret { get; set; } = string.Empty;
}

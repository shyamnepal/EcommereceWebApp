using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Allow React app (Vite default port) to call this API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();
app.UseCors();

// In-memory user store (for learning; use a database in real apps)
var users = new Dictionary<string, UserRecord>(StringComparer.OrdinalIgnoreCase);

string HashPassword(string password)
{
    var bytes = Encoding.UTF8.GetBytes(password);
    var hash = SHA256.HashData(bytes);
    return Convert.ToBase64String(hash);
}

// POST /api/auth/signup - matches your React signup: name, email, password
app.MapPost("/api/auth/signup", (SignupRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Email))
        return Results.BadRequest(new { success = false, message = "Email is required." });
    if (string.IsNullOrWhiteSpace(req.Name))
        return Results.BadRequest(new { success = false, message = "Name is required." });
    if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
        return Results.BadRequest(new { success = false, message = "Password must be at least 6 characters." });

    var emailKey = req.Email.Trim().ToLowerInvariant();
    if (users.ContainsKey(emailKey))
        return Results.BadRequest(new { success = false, message = "An account with this email already exists." });

    var user = new UserRecord
    {
        Id = Guid.NewGuid().ToString(),
        Name = req.Name.Trim(),
        Email = emailKey,
        PasswordHash = HashPassword(req.Password)
    };
    users[emailKey] = user;

    return Results.Ok(new
    {
        success = true,
        message = "Account created successfully.",
        user = new { id = user.Id, name = user.Name, email = user.Email }
    });
});

// POST /api/auth/login - matches your React login: email, password
app.MapPost("/api/auth/login", (LoginRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
        return Results.BadRequest(new { success = false, message = "Email and password are required." });

    var emailKey = req.Email.Trim().ToLowerInvariant();
    if (!users.TryGetValue(emailKey, out var user))
        return Results.Json(new { success = false, message = "Invalid email or password." }, statusCode: 401);

    var passwordHash = HashPassword(req.Password);
    if (user.PasswordHash != passwordHash)
        return Results.Json(new { success = false, message = "Invalid email or password." }, statusCode: 401);

    // Simple token for learning (use JWT in production)
    var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());

    return Results.Ok(new
    {
        success = true,
        message = "Signed in successfully.",
        token,
        user = new { id = user.Id, name = user.Name, email = user.Email }
    });
});

app.Run();

// Request/response models
record SignupRequest(string? Email, string? Name, string? Password);
record LoginRequest(string? Email, string? Password);

class UserRecord
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
}

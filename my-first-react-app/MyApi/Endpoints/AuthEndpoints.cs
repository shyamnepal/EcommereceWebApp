using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using MyApi.Data;
using MyApi.DTOs;
using MyApi.Models;

namespace MyApi.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/auth");

        group.MapPost("/signup", async (SignupRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email))
                return Results.BadRequest(new { success = false, message = "Email is required." });
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { success = false, message = "Name is required." });
            if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
                return Results.BadRequest(new { success = false, message = "Password must be at least 6 characters." });

            var emailKey = req.Email.Trim().ToLowerInvariant();
            if (await db.Users.AnyAsync(u => u.Email == emailKey))
                return Results.BadRequest(new { success = false, message = "An account with this email already exists." });

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = req.Name.Trim(),
                Email = emailKey,
                PasswordHash = HashPassword(req.Password),
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                success = true,
                message = "Account created successfully.",
                user = new { id = user.Id, name = user.Name, email = user.Email }
            });
        });

        group.MapPost("/login", async (LoginRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return Results.BadRequest(new { success = false, message = "Email and password are required." });

            var emailKey = req.Email.Trim().ToLowerInvariant();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == emailKey);
            if (user == null)
                return Results.Json(new { success = false, message = "Invalid email or password." }, statusCode: 401);

            var passwordHash = HashPassword(req.Password);
            if (user.PasswordHash != passwordHash)
                return Results.Json(new { success = false, message = "Invalid email or password." }, statusCode: 401);

            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            return Results.Ok(new
            {
                success = true,
                message = "Signed in successfully.",
                token,
                user = new { id = user.Id, name = user.Name, email = user.Email }
            });
        });
    }

    private static string HashPassword(string password)
    {
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
}

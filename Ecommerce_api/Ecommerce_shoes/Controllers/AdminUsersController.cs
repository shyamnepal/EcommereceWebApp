using System.Security.Claims;
using DataAcess.Entity;
using Ecommerce_shoes.Dtos.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce_shoes.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public AdminUsersController(UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    /// <summary>
    /// POST api/AdminUsers/Create - Admin creates a new user (EmailConfirmed = true so they can log in immediately).
    /// </summary>
    [HttpPost("Create")]
    public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserRequest request)
    {
        if (request == null) return BadRequest(new { message = "Request body is required." });

        var userName = request.UserName?.Trim();
        var email = request.Email?.Trim();
        var password = request.Password ?? string.Empty;

        if (string.IsNullOrEmpty(userName) || userName.Length < 2)
            return BadRequest(new { message = "UserName must be at least 2 characters." });
        if (string.IsNullOrEmpty(email)) return BadRequest(new { message = "Email is required." });
        if (password.Length < 6) return BadRequest(new { message = "Password must be at least 6 characters." });

        var exists = await _userManager.FindByNameAsync(userName);
        if (exists != null)
            return BadRequest(new { message = "A user with this username already exists." });

        exists = await _userManager.FindByEmailAsync(email);
        if (exists != null)
            return BadRequest(new { message = "A user with this email already exists." });

        var user = new User
        {
            UserName = userName,
            Email = email,
            Address = request.Address ?? string.Empty,
            EmailConfirmed = true // Admin-created users can log in immediately
        };

        var createResult = await _userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            var errors = createResult.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { message = string.Join(" ", errors) });
        }

        var roles = (request.Roles ?? new List<string>())
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (roles.Count == 0) roles = new List<string> { "User" };

        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
                await _roleManager.CreateAsync(new IdentityRole(role));
        }
        await _userManager.AddToRolesAsync(user, roles);

        return Ok(new
        {
            id = user.Id,
            userName = user.UserName,
            email = user.Email,
            roles = await _userManager.GetRolesAsync(user)
        });
    }

    /// <summary>
    /// GET api/AdminUsers?page=1&pageSize=20&q=john
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedUsersResultDto>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? q = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _userManager.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var needle = q.Trim();
            query = query.Where(u =>
                (u.UserName != null && u.UserName.Contains(needle)) ||
                (u.Email != null && u.Email.Contains(needle)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(needle)));
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .OrderBy(u => u.UserName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = new List<AdminUserListDto>(users.Count);
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            items.Add(MapToListDto(u, roles));
        }

        return Ok(new PagedUsersResultDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// GET api/AdminUsers/{id}
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AdminUserDetailDto>> GetUserById(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        var roles = await _userManager.GetRolesAsync(user);
        return Ok(MapToDetailDto(user, roles));
    }

    /// <summary>
    /// PATCH api/AdminUsers/{id}/Lock - body: { "locked": true }
    /// Locks/unlocks the account via Identity lockout.
    /// </summary>
    [HttpPatch("{id}/Lock")]
    public async Task<IActionResult> SetLock(string id, [FromBody] UpdateUserLockRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!string.IsNullOrEmpty(currentUserId) && string.Equals(currentUserId, id, StringComparison.Ordinal))
            return BadRequest(new { message = "You cannot lock/unlock your own account." });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
        if (request.Locked && isAdmin && await WouldRemoveLastAdminAsync(user))
            return BadRequest(new { message = "Cannot lock the last remaining admin." });

        // Ensure lockout is enabled so LockoutEnd works.
        if (!user.LockoutEnabled)
        {
            var enabled = await _userManager.SetLockoutEnabledAsync(user, true);
            if (!enabled.Succeeded) return BadRequest(enabled.Errors);
        }

        var lockoutEnd = request.Locked ? DateTimeOffset.UtcNow.AddYears(100) : (DateTimeOffset?)null;
        var result = await _userManager.SetLockoutEndDateAsync(user, lockoutEnd);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new
        {
            id = user.Id,
            locked = request.Locked,
            lockoutEnd = user.LockoutEnd
        });
    }

    /// <summary>
    /// PUT api/AdminUsers/{id}/Roles - body: { "roles": ["Admin","User"] }
    /// Sets the user's roles to exactly the provided list.
    /// </summary>
    [HttpPut("{id}/Roles")]
    public async Task<IActionResult> SetRoles(string id, [FromBody] UpdateUserRolesRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var normalizedRoles = (request?.Roles ?? new List<string>())
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalizedRoles.Count == 0)
            return BadRequest(new { message = "At least one role is required." });

        var currentUserId = GetCurrentUserId();
        var existingRoles = await _userManager.GetRolesAsync(user);

        if (!string.IsNullOrEmpty(currentUserId) &&
            string.Equals(currentUserId, id, StringComparison.Ordinal) &&
            existingRoles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase)) &&
            !normalizedRoles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest(new { message = "You cannot remove your own Admin role." });
        }

        if (existingRoles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase)) &&
            !normalizedRoles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase)) &&
            await WouldRemoveLastAdminAsync(user))
        {
            return BadRequest(new { message = "Cannot remove Admin role from the last remaining admin." });
        }

        foreach (var role in normalizedRoles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                var createRole = await _roleManager.CreateAsync(new IdentityRole(role));
                if (!createRole.Succeeded) return BadRequest(createRole.Errors);
            }
        }

        var toRemove = existingRoles.Except(normalizedRoles, StringComparer.OrdinalIgnoreCase).ToList();
        var toAdd = normalizedRoles.Except(existingRoles, StringComparer.OrdinalIgnoreCase).ToList();

        if (toRemove.Count > 0)
        {
            var removeRes = await _userManager.RemoveFromRolesAsync(user, toRemove);
            if (!removeRes.Succeeded) return BadRequest(removeRes.Errors);
        }

        if (toAdd.Count > 0)
        {
            var addRes = await _userManager.AddToRolesAsync(user, toAdd);
            if (!addRes.Succeeded) return BadRequest(addRes.Errors);
        }

        var rolesNow = await _userManager.GetRolesAsync(user);
        return Ok(new { id = user.Id, roles = rolesNow });
    }

    /// <summary>
    /// PATCH api/AdminUsers/{id}/Password - body: { "newPassword": "..." }
    /// Admin sets a new password for any user without knowing the current one.
    /// </summary>
    [HttpPatch("{id}/Password")]
    public async Task<IActionResult> ChangePassword(string id, [FromBody] AdminChangePasswordRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.NewPassword))
            return BadRequest(new { message = "NewPassword is required and must be at least 6 characters." });
        if (request.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var hasPassword = await _userManager.HasPasswordAsync(user);
        if (hasPassword)
        {
            var removeResult = await _userManager.RemovePasswordAsync(user);
            if (!removeResult.Succeeded)
                return BadRequest(new { message = string.Join(" ", removeResult.Errors.Select(e => e.Description)) });
        }

        var addResult = await _userManager.AddPasswordAsync(user, request.NewPassword);
        if (!addResult.Succeeded)
            return BadRequest(new { message = string.Join(" ", addResult.Errors.Select(e => e.Description)) });

        return Ok(new { id = user.Id, message = "Password updated successfully." });
    }

    /// <summary>
    /// DELETE api/AdminUsers/{id}
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var currentUserId = GetCurrentUserId();
        if (!string.IsNullOrEmpty(currentUserId) && string.Equals(currentUserId, id, StringComparison.Ordinal))
            return BadRequest(new { message = "You cannot delete your own account." });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
        if (isAdmin && await WouldRemoveLastAdminAsync(user))
            return BadRequest(new { message = "Cannot delete the last remaining admin." });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { id });
    }

    private string? GetCurrentUserId()
    {
        // Your JWT includes a custom "Id" claim (see AccountRepository.GenerateToken).
        return User.FindFirstValue("Id")
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    private static bool IsLocked(User u)
    {
        return u.LockoutEnd.HasValue && u.LockoutEnd.Value > DateTimeOffset.UtcNow;
    }

    private static AdminUserListDto MapToListDto(User u, IEnumerable<string> roles)
    {
        return new AdminUserListDto
        {
            Id = u.Id,
            UserName = u.UserName ?? "",
            Email = u.Email ?? "",
            EmailConfirmed = u.EmailConfirmed,
            PhoneNumber = u.PhoneNumber,
            IsLocked = IsLocked(u),
            LockoutEnd = u.LockoutEnd,
            Roles = roles.OrderBy(r => r).ToList()
        };
    }

    private static AdminUserDetailDto MapToDetailDto(User u, IEnumerable<string> roles)
    {
        return new AdminUserDetailDto
        {
            Id = u.Id,
            UserName = u.UserName ?? "",
            Email = u.Email ?? "",
            EmailConfirmed = u.EmailConfirmed,
            PhoneNumber = u.PhoneNumber,
            Address = u.Address,
            IsLocked = IsLocked(u),
            LockoutEnd = u.LockoutEnd,
            Roles = roles.OrderBy(r => r).ToList()
        };
    }

    private async Task<bool> WouldRemoveLastAdminAsync(User targetAdminUser)
    {
        // If there is only one admin and it's this user, then it would remove the last admin.
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        if (admins.Count == 0) return false;
        if (admins.Count > 1) return false;
        return string.Equals(admins[0].Id, targetAdminUser.Id, StringComparison.Ordinal);
    }
}


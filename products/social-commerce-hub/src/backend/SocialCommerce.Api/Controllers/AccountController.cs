using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Api.Controllers;

[Route("api/[controller]")]
public class AccountController : BaseApiController
{
    private readonly IAccountService _accountService;

    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    /// <summary>
    /// Retrieves the profile settings of the currently authenticated user
    /// </summary>
    [Authorize]
    [HttpGet("profile")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfile(CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Failed<UserProfileDto>("Unauthorized token claims.", "Unauthorized", StatusCodes.Status401Unauthorized);
        }

        var profile = await _accountService.GetProfileAsync(userId.Value, ct);
        return Success(profile, "User profile retrieved successfully.");
    }

    /// <summary>
    /// Updates the profile settings (full name, phone number, avatar URL)
    /// </summary>
    [Authorize]
    [HttpPut("profile")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Failed<UserProfileDto>("Unauthorized token claims.", "Unauthorized", StatusCodes.Status401Unauthorized);
        }

        var updated = await _accountService.UpdateProfileAsync(userId.Value, request, ct);
        return Success(updated, "Profile updated successfully.");
    }

    /// <summary>
    /// Changes the password for the currently authenticated user
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object>>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Failed<object>("Unauthorized token claims.", "Unauthorized", StatusCodes.Status401Unauthorized);
        }

        await _accountService.ChangePasswordAsync(userId.Value, request, ct);
        return Success<object>(new { success = true }, "Password changed successfully.");
    }

    /// <summary>
    /// Requests a password reset link for the specified email address
    /// </summary>
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken ct = default)
    {
        await _accountService.ForgotPasswordAsync(request, ct);
        return Success<object>(
            new { message = "If the email is registered, a password reset link has been dispatched." },
            "Password reset request processed.");
    }

    /// <summary>
    /// Resets the user's password using the provided reset token
    /// </summary>
    [AllowAnonymous]
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        CancellationToken ct = default)
    {
        await _accountService.ResetPasswordAsync(request, ct);
        return Success<object>(
            new { success = true },
            "Password has been reset successfully. You can now log in with your new password.");
    }

    /// <summary>
    /// Confirms the user's email address using the verification token
    /// </summary>
    [AllowAnonymous]
    [HttpPost("confirm-email")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> ConfirmEmail(
        [FromBody] ConfirmEmailRequest request,
        CancellationToken ct = default)
    {
        await _accountService.ConfirmEmailAsync(request, ct);
        return Success<object>(
            new { success = true },
            "Email verified and confirmed successfully.");
    }

    /// <summary>
    /// Resends the email verification token to the user's email address
    /// </summary>
    [AllowAnonymous]
    [HttpPost("resend-confirmation")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> ResendConfirmation(
        [FromBody] ResendConfirmationRequest request,
        CancellationToken ct = default)
    {
        await _accountService.ResendConfirmationEmailAsync(request, ct);
        return Success<object>(
            new { message = "If the email is pending confirmation, a new verification link has been dispatched." },
            "Email confirmation link sent.");
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(claim) || !Guid.TryParse(claim, out var userId))
        {
            return null;
        }
        return userId;
    }
}

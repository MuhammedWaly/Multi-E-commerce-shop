using Microsoft.Extensions.Logging;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendEmailConfirmationAsync(string toEmail, string fullName, string token, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[EMAIL SERVICE] >> Email Confirmation dispatched to: {Email} ({FullName}) | Verification Token: {Token}",
            toEmail,
            fullName,
            token);

        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[EMAIL SERVICE] >> Password Reset Link dispatched to: {Email} ({FullName}) | Reset Token: {Token}",
            toEmail,
            fullName,
            token);

        return Task.CompletedTask;
    }
}

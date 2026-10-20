namespace SocialCommerce.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string fullName, string token, CancellationToken ct = default);
    Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken ct = default);
}

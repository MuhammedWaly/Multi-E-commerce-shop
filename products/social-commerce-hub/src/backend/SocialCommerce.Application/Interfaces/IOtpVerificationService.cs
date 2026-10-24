namespace SocialCommerce.Application.Interfaces;

public record SendPhoneOtpRequest(string PhoneNumber);
public record VerifyPhoneOtpRequest(string PhoneNumber, string Code);

public record SendOtpResult(
    bool Success,
    string PhoneNumber,
    string Message,
    string? DemoCode = null
);

public record VerifyOtpResult(
    bool Success,
    string PhoneNumber,
    string Message
);

public interface IOtpVerificationService
{
    SendOtpResult SendOtp(string phoneNumber);
    VerifyOtpResult VerifyOtp(string phoneNumber, string code);
}

using System.Collections.Concurrent;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Infrastructure.Services;

public class OtpVerificationService : IOtpVerificationService
{
    private class OtpRecord
    {
        public string Code { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
        public int Attempts { get; set; }
    }

    private static readonly ConcurrentDictionary<string, OtpRecord> _cache = new();

    private static string NormalizePhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("20")) digits = digits[2..];
        if (digits.StartsWith("0")) digits = digits[1..];
        return digits;
    }

    public SendOtpResult SendOtp(string phoneNumber)
    {
        var normalized = NormalizePhone(phoneNumber);
        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length < 9)
        {
            return new SendOtpResult(false, phoneNumber, "يرجى إدخال رقم هاتف محمول مصري صالح (11 رقم) / Please enter a valid 11-digit Egyptian mobile number.");
        }

        // Generate 4-digit code
        var code = Random.Shared.Next(1000, 9999).ToString();
        var record = new OtpRecord
        {
            Code = code,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(5),
            Attempts = 0
        };

        _cache[normalized] = record;

        return new SendOtpResult(
            true,
            phoneNumber,
            $"تم إرسال كود التحقق السريع المكون من 4 أرقام بنجاح / 4-digit verification code sent via SMS/WhatsApp.",
            DemoCode: code
        );
    }

    public VerifyOtpResult VerifyOtp(string phoneNumber, string code)
    {
        var normalized = NormalizePhone(phoneNumber);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return new VerifyOtpResult(false, phoneNumber, "رقم الهاتف غير صالح / Invalid phone number.");
        }

        if (string.IsNullOrWhiteSpace(code) || code.Trim().Length != 4)
        {
            return new VerifyOtpResult(false, phoneNumber, "كود التحقق يجب أن يتكون من 4 أرقام / Verification code must be exactly 4 digits.");
        }

        if (!_cache.TryGetValue(normalized, out var record))
        {
            return new VerifyOtpResult(false, phoneNumber, "لم يتم العثور على طلب كود لهذا الرقم أو انتهت صلاحيته / No OTP request found or code expired.");
        }

        if (DateTime.UtcNow > record.ExpiresAtUtc)
        {
            _cache.TryRemove(normalized, out _);
            return new VerifyOtpResult(false, phoneNumber, "انتهت صلاحية كود التحقق. يرجى طلب كود جديد / OTP has expired. Please request a new code.");
        }

        record.Attempts++;
        if (record.Attempts > 5)
        {
            _cache.TryRemove(normalized, out _);
            return new VerifyOtpResult(false, phoneNumber, "تم تجاوز الحد الأقصى للمحاولات / Too many failed attempts.");
        }

        if (record.Code != code.Trim())
        {
            return new VerifyOtpResult(false, phoneNumber, "كود التحقق غير صحيح / Incorrect verification code.");
        }

        // Verification successful, consume code
        _cache.TryRemove(normalized, out _);
        return new VerifyOtpResult(true, phoneNumber, "تم تأكيد وتوثيق رقم الهاتف بنجاح ✓ / Phone number verified successfully.");
    }
}

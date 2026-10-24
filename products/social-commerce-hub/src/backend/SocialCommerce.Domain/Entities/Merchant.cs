namespace SocialCommerce.Domain.Entities;

public class Merchant
{
    public Guid Id { get; private set; }
    public string StoreName { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public decimal Balance { get; private set; }
    public bool IsActive { get; private set; }
    public double Latitude { get; private set; } = 30.0626;
    public double Longitude { get; private set; } = 31.2223;
    private string _address = "Zamalek, Cairo";
    public string Address { get => _address ?? "Zamalek, Cairo"; private set => _address = value ?? "Zamalek, Cairo"; }
    private string _city = "Cairo";
    public string City { get => _city ?? "Cairo"; private set => _city = value ?? "Cairo"; }
    private string _tagline = string.Empty;
    public string Tagline { get => _tagline ?? string.Empty; private set => _tagline = value ?? string.Empty; }
    private string _bio = string.Empty;
    public string Bio { get => _bio ?? string.Empty; private set => _bio = value ?? string.Empty; }
    private string _avatarUrl = string.Empty;
    public string AvatarUrl { get => _avatarUrl ?? string.Empty; private set => _avatarUrl = value ?? string.Empty; }
    private string _bannerUrl = string.Empty;
    public string BannerUrl { get => _bannerUrl ?? string.Empty; private set => _bannerUrl = value ?? string.Empty; }
    private string _phone = string.Empty;
    public string Phone { get => _phone ?? string.Empty; private set => _phone = value ?? string.Empty; }
    public DateTime CreatedAtUtc { get; private set; }

    // Parameterless constructor required by EF Core
    private Merchant() { }

    public Merchant(
        string storeName, 
        string slug, 
        string email, 
        double latitude = 30.0626, 
        double longitude = 31.2223, 
        string address = "Zamalek, Cairo", 
        string city = "Cairo",
        string tagline = "",
        string bio = "",
        string avatarUrl = "",
        string bannerUrl = "",
        string phone = "")
    {
        if (string.IsNullOrWhiteSpace(storeName))
            throw new ArgumentException("Store name cannot be empty.", nameof(storeName));

        if (string.IsNullOrWhiteSpace(slug))
            throw new ArgumentException("Store slug cannot be empty.", nameof(slug));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty.", nameof(email));

        Id = Guid.NewGuid();
        StoreName = storeName.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        Email = email.Trim().ToLowerInvariant();
        Balance = 0m;
        IsActive = true;
        Latitude = latitude;
        Longitude = longitude;
        Address = string.IsNullOrWhiteSpace(address) ? "Zamalek, Cairo" : address.Trim();
        City = string.IsNullOrWhiteSpace(city) ? "Cairo" : city.Trim();
        Tagline = tagline?.Trim() ?? string.Empty;
        Bio = bio?.Trim() ?? string.Empty;
        AvatarUrl = avatarUrl?.Trim() ?? string.Empty;
        BannerUrl = bannerUrl?.Trim() ?? string.Empty;
        Phone = phone?.Trim() ?? string.Empty;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void UpdateProfile(
        string storeName,
        string? tagline,
        string? bio,
        string? avatarUrl,
        string? bannerUrl,
        string? phone,
        string? address,
        string? city,
        double? latitude = null,
        double? longitude = null)
    {
        if (string.IsNullOrWhiteSpace(storeName))
            throw new ArgumentException("Store name cannot be empty.", nameof(storeName));

        StoreName = storeName.Trim();
        Tagline = tagline?.Trim() ?? string.Empty;
        Bio = bio?.Trim() ?? string.Empty;
        AvatarUrl = avatarUrl?.Trim() ?? string.Empty;
        BannerUrl = bannerUrl?.Trim() ?? string.Empty;
        Phone = phone?.Trim() ?? string.Empty;

        if (!string.IsNullOrWhiteSpace(address))
            Address = address.Trim();
        if (!string.IsNullOrWhiteSpace(city))
            City = city.Trim();

        if (latitude.HasValue)
            Latitude = latitude.Value;
        if (longitude.HasValue)
            Longitude = longitude.Value;
    }

    public void SetLocation(double latitude, double longitude, string address, string city)
    {
        Latitude = latitude;
        Longitude = longitude;
        if (!string.IsNullOrWhiteSpace(address))
            Address = address.Trim();
        if (!string.IsNullOrWhiteSpace(city))
            City = city.Trim();
    }

    public void CreditBalance(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Credit amount must be strictly positive.", nameof(amount));

        Balance += amount;
    }

    public void PayoutBalance(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Payout amount must be strictly positive.", nameof(amount));

        if (amount > Balance)
            throw new InvalidOperationException("Insufficient merchant balance for payout.");

        Balance -= amount;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
    }
}

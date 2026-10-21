using Microsoft.EntityFrameworkCore;
using SocialCommerce.Domain.Entities;

namespace SocialCommerce.Infrastructure.Persistence;

public class SocialCommerceDbContext : DbContext
{
    public SocialCommerceDbContext(DbContextOptions<SocialCommerceDbContext> options)
        : base(options)
    {
    }

    public DbSet<Merchant> Merchants => Set<Merchant>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<MerchantLedgerEntry> MerchantLedgerEntries => Set<MerchantLedgerEntry>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User Configuration
        modelBuilder.Entity<User>(b =>
        {
            b.HasKey(u => u.Id);
            b.Property(u => u.Email).IsRequired().HasMaxLength(255);
            b.HasIndex(u => u.Email).IsUnique();
            b.Property(u => u.FullName).IsRequired().HasMaxLength(150);
            b.Property(u => u.PasswordHash).IsRequired().HasMaxLength(500);
            b.Property(u => u.Salt).IsRequired().HasMaxLength(100);
            b.Property(u => u.PhoneNumber).HasMaxLength(30);
            b.Property(u => u.AvatarUrl).HasMaxLength(1000);
            b.Property(u => u.EmailConfirmationToken).HasMaxLength(100);
            b.Property(u => u.PasswordResetToken).HasMaxLength(100);
            b.HasIndex(u => u.MerchantId);
        });

        // Merchant Configuration
        modelBuilder.Entity<Merchant>(b =>
        {
            b.HasKey(m => m.Id);
            b.Property(m => m.StoreName).IsRequired().HasMaxLength(150);
            b.Property(m => m.Slug).IsRequired().HasMaxLength(100);
            b.HasIndex(m => m.Slug).IsUnique();
            b.Property(m => m.Email).IsRequired().HasMaxLength(255);
            b.Property(m => m.Balance).HasPrecision(18, 2);
        });

        // Product Configuration
        modelBuilder.Entity<Product>(b =>
        {
            b.HasKey(p => p.Id);
            b.Property(p => p.Title).IsRequired().HasMaxLength(200);
            b.Property(p => p.Price).HasPrecision(18, 2);
            b.Property(p => p.MediaUrl).IsRequired().HasMaxLength(1000);
            b.HasIndex(p => p.MerchantId);
        });

        // Order Configuration
        modelBuilder.Entity<Order>(b =>
        {
            b.HasKey(o => o.Id);
            b.Property(o => o.CustomerName).IsRequired().HasMaxLength(150);
            b.Property(o => o.CustomerEmail).IsRequired().HasMaxLength(255);
            b.Property(o => o.ShippingAddress).IsRequired().HasMaxLength(500);
            b.Property(o => o.TotalAmount).HasPrecision(18, 2);
            b.Property(o => o.PlatformFeeAmount).HasPrecision(18, 2);
            b.Property(o => o.MerchantNetAmount).HasPrecision(18, 2);
            b.Property(o => o.PlatformFeeRate).HasPrecision(5, 4);

            b.Property(o => o.PaymentMethod).HasMaxLength(50);
            b.Property(o => o.PaymentReference).HasMaxLength(100);
            b.Property(o => o.PaymentInstructions).HasMaxLength(1000);
            b.Property(o => o.PaymentExpiresAtUtc);
            b.Property(o => o.SenderWalletOrReference).HasMaxLength(100);

            b.HasMany(o => o.Items)
             .WithOne()
             .HasForeignKey(i => i.OrderId)
             .OnDelete(DeleteBehavior.Cascade);

            b.Navigation(o => o.Items).UsePropertyAccessMode(PropertyAccessMode.Field);
            b.HasIndex(o => o.MerchantId);
            b.HasIndex(o => o.PaymentOrderId);
            b.HasIndex(o => o.PaymentReference);
        });

        // OrderItem Configuration
        modelBuilder.Entity<OrderItem>(b =>
        {
            b.HasKey(i => i.Id);
            b.Property(i => i.ProductTitle).IsRequired().HasMaxLength(200);
            b.Property(i => i.UnitPrice).HasPrecision(18, 2);
        });

        // MerchantLedgerEntry Configuration
        modelBuilder.Entity<MerchantLedgerEntry>(b =>
        {
            b.HasKey(l => l.Id);
            b.Property(l => l.Amount).HasPrecision(18, 2);
            b.Property(l => l.Description).IsRequired().HasMaxLength(500);
            b.HasIndex(l => l.MerchantId);
            b.HasIndex(l => l.OrderId);
        });

        // Review Configuration
        modelBuilder.Entity<Review>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.CustomerName).IsRequired().HasMaxLength(150);
            b.Property(r => r.CustomerEmail).IsRequired().HasMaxLength(255);
            b.Property(r => r.Comment).IsRequired().HasMaxLength(1000);
            b.HasIndex(r => r.ProductId);
            b.HasIndex(r => r.OrderId);
        });
    }
}

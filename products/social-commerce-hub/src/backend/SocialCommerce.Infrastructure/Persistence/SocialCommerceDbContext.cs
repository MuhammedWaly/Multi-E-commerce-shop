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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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

            b.HasMany(o => o.Items)
             .WithOne()
             .HasForeignKey(i => i.OrderId)
             .OnDelete(DeleteBehavior.Cascade);

            b.Navigation(o => o.Items).UsePropertyAccessMode(PropertyAccessMode.Field);
            b.HasIndex(o => o.MerchantId);
            b.HasIndex(o => o.PaymentOrderId);
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
    }
}

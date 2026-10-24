using Microsoft.EntityFrameworkCore;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;
using Xunit.Abstractions;

namespace SocialCommerce.Tests;

public class UnitTest1
{
    private readonly ITestOutputHelper _output;
    public UnitTest1(ITestOutputHelper output) => _output = output;

    [Fact]
    public async Task AdminService_Should_Retrieve_Overview_And_Entities_Without_Null_Exceptions()
    {
        var options = new DbContextOptionsBuilder<SocialCommerceDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;

        using var db = new SocialCommerceDbContext(options);
        await db.Database.OpenConnectionAsync();
        await DbInitializer.InitializeAsync(db);

        var adminService = new AdminService(db);

        var overview = await adminService.GetOverviewAsync();
        Assert.NotNull(overview);
        Assert.True(overview.TotalUsersCount > 0);

        var merchants = await adminService.GetAllMerchantsAsync();
        Assert.NotNull(merchants);

        var users = await adminService.GetAllUsersAsync();
        Assert.NotNull(users);

        var orders = await adminService.GetAllOrdersAsync();
        Assert.NotNull(orders);
    }
}

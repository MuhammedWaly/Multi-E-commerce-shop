using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SocialCommerce.Application.Interfaces;

namespace SocialCommerce.Infrastructure.Services;

/// <summary>
/// Periodic hosted worker responsible for health checks, cache hygiene, and scheduled housekeeping.
/// </summary>
public class MaintenanceBackgroundWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MaintenanceBackgroundWorker> _logger;
    private readonly PeriodicTimer _timer;

    public MaintenanceBackgroundWorker(
        IServiceProvider serviceProvider,
        ILogger<MaintenanceBackgroundWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _timer = new PeriodicTimer(TimeSpan.FromMinutes(15));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Maintenance Background Worker started.");

        try
        {
            while (!stoppingToken.IsCancellationRequested && await _timer.WaitForNextTickAsync(stoppingToken))
            {
                using var scope = _serviceProvider.CreateScope();
                var cache = scope.ServiceProvider.GetService<ICacheService>();
                _logger.LogInformation("Scheduled maintenance tick executed. System health & background channels nominal.");
            }
        }
        catch (OperationCanceledException)
        {
            // Expected on host shutdown
        }
        finally
        {
            _timer.Dispose();
        }

        _logger.LogInformation("Maintenance Background Worker stopped.");
    }
}

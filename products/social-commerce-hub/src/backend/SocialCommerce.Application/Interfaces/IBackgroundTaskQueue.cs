namespace SocialCommerce.Application.Interfaces;

/// <summary>
/// Thread-safe asynchronous background work queue for decoupling heavy, non-blocking
/// operations (emails, notifications, analytics, cache warm-up, reconciliation) from the request thread.
/// </summary>
public interface IBackgroundTaskQueue
{
    ValueTask QueueBackgroundWorkItemAsync(Func<IServiceProvider, CancellationToken, ValueTask> workItem);
    ValueTask<Func<IServiceProvider, CancellationToken, ValueTask>> DequeueAsync(CancellationToken cancellationToken);
}

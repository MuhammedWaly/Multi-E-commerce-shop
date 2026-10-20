using Microsoft.EntityFrameworkCore;
using SocialCommerce.Application.DTOs;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Payments.Models;
using SocialCommerce.Infrastructure.Payments;
using SocialCommerce.Infrastructure.Payments.PayPal;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Register EF Core SQLite Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Data Source=social_commerce.db";
builder.Services.AddDbContext<SocialCommerceDbContext>(options =>
    options.UseSqlite(connectionString));

// Register Core Domain & Catalog Services
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<IOrderService, OrderService>();

// Register Payment Engine
builder.Services.AddSingleton<IPaymentProvider, PayPalPaymentProvider>();
builder.Services.AddSingleton<IPaymentProviderFactory, PaymentProviderFactory>();

// Enable CORS for React Web Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

// Initialize and seed database if necessary
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SocialCommerceDbContext>();
    await DbInitializer.InitializeAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

// ==========================================
// 1. Interactive Feed Endpoints
// ==========================================
app.MapGet("/api/feed", async (int? page, int? pageSize, ICatalogService catalogService, CancellationToken ct) =>
{
    var p = page.GetValueOrDefault(1);
    var size = pageSize.GetValueOrDefault(20);
    var feed = await catalogService.GetFeedAsync(p, size, ct);
    return Results.Ok(feed);
})
.WithName("GetFeed");

// ==========================================
// 2. Merchant Store Setup & Management
// ==========================================
app.MapPost("/api/merchants", async (CreateMerchantRequest request, ICatalogService catalogService, CancellationToken ct) =>
{
    try
    {
        var merchant = await catalogService.CreateMerchantAsync(request, ct);
        return Results.Created($"/api/merchants/{merchant.Slug}", merchant);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("CreateMerchant");

app.MapGet("/api/merchants/{slug}", async (string slug, ICatalogService catalogService, CancellationToken ct) =>
{
    var merchant = await catalogService.GetMerchantBySlugAsync(slug, ct);
    return merchant is not null ? Results.Ok(merchant) : Results.NotFound(new { error = "Merchant store not found." });
})
.WithName("GetMerchantBySlug");

app.MapPost("/api/merchants/{merchantId:guid}/products", async (Guid merchantId, AddProductRequest request, ICatalogService catalogService, CancellationToken ct) =>
{
    try
    {
        var product = await catalogService.AddProductAsync(merchantId, request, ct);
        return Results.Created($"/api/products/{product.Id}", product);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("AddProduct");

// ==========================================
// 3. Orders & Checkout Lifecycle Endpoints
// ==========================================
app.MapPost("/api/orders", async (CreateOrderRequest request, IOrderService orderService, CancellationToken ct) =>
{
    try
    {
        var order = await orderService.CreateOrderAsync(request, ct);
        return Results.Created($"/api/orders/{order.Id}", order);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
})
.WithName("CreateOrder");

app.MapGet("/api/orders/{id:guid}", async (Guid id, IOrderService orderService, CancellationToken ct) =>
{
    var order = await orderService.GetOrderByIdAsync(id, ct);
    return order is not null ? Results.Ok(order) : Results.NotFound(new { error = "Order not found." });
})
.WithName("GetOrderById");

app.MapPost("/api/orders/{id:guid}/capture", async (Guid id, CaptureOrderRequest request, IOrderService orderService, CancellationToken ct) =>
{
    var result = await orderService.CaptureOrderAsync(id, request, ct);
    return result.IsSuccess 
        ? Results.Ok(result) 
        : Results.BadRequest(new { error = result.ErrorMessage, status = result.Status });
})
.WithName("CaptureOrder");

// Legacy fast checkout simulation endpoint for frontend compatibility
app.MapPost("/api/payments/create-order", async (PaymentOrderRequest request, IPaymentProviderFactory paymentFactory, CancellationToken ct) =>
{
    var provider = paymentFactory.GetDefaultProvider();
    var result = await provider.CreatePaymentOrderAsync(request, ct);

    return result.IsSuccess 
        ? Results.Ok(result) 
        : Results.BadRequest(new { error = result.ErrorMessage });
})
.WithName("CreatePaymentOrder");

// ==========================================
// 4. Merchant Financial Ledger Endpoints
// ==========================================
app.MapGet("/api/merchants/{merchantId:guid}/ledger", async (Guid merchantId, IOrderService orderService, CancellationToken ct) =>
{
    var ledger = await orderService.GetMerchantLedgerAsync(merchantId, ct);
    return Results.Ok(ledger);
})
.WithName("GetMerchantLedger");

app.Run();

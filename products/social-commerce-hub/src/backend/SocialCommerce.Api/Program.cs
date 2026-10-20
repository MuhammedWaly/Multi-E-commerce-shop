using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialCommerce.Api.Filters;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Application.Payments;
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
builder.Services.AddScoped<IReviewService, ReviewService>();

// Register Payment Engine
builder.Services.AddSingleton<IPaymentProvider, PayPalPaymentProvider>();
builder.Services.AddSingleton<IPaymentProviderFactory, PaymentProviderFactory>();

// Register Controllers with Global Exception & Validation Filters
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ApiExceptionFilterAttribute>();
    options.Filters.Add<ValidateModelAttribute>();
});

// Configure standardized API model validation responses
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .Where(msg => !string.IsNullOrWhiteSpace(msg))
            .ToList();

        if (errors.Count == 0)
        {
            errors.Add("Invalid model state.");
        }

        var response = ApiResponse<object>.Fail(errors, "Model validation failed.");
        return new BadRequestObjectResult(response);
    };
});

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

// Map RESTful Controllers
app.MapControllers();

app.Run();

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SocialCommerce.Api.Filters;
using SocialCommerce.Api.Middleware;
using SocialCommerce.Application.Common;
using SocialCommerce.Application.Interfaces;
using SocialCommerce.Application.Payments;
using SocialCommerce.Application.Shipping;
using SocialCommerce.Infrastructure.Payments;
using SocialCommerce.Infrastructure.Payments.Egyptian;
using SocialCommerce.Infrastructure.Payments.PayPal;
using SocialCommerce.Infrastructure.Persistence;
using SocialCommerce.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Register EF Core SQLite Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Data Source=social_commerce.db";
builder.Services.AddDbContext<SocialCommerceDbContext>(options =>
    options.UseSqlite(connectionString));

// Multi-Tenancy Architecture
builder.Services.AddScoped<ITenantContext, TenantContext>();

// Caching Layer: In-Memory L1 + Distributed L2 (Redis / Fallback) + Output Cache
builder.Services.AddMemoryCache();
var redisConnection = builder.Configuration.GetConnectionString("Redis")
                      ?? builder.Configuration["Redis:ConnectionString"]
                      ?? (builder.Environment.IsProduction() ? "localhost:6379,abortConnect=false" : null);

if (!string.IsNullOrWhiteSpace(redisConnection))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnection;
        options.InstanceName = "SocialCommerce_";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
}
builder.Services.AddSingleton<ICacheService, HybridDistributedCacheService>();
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(b => b.Expire(TimeSpan.FromSeconds(30)));
    options.AddPolicy("CatalogCache", b => b.Expire(TimeSpan.FromMinutes(2)).Tag("catalog"));
});

// Background Worker & Async Queue Infrastructure
builder.Services.AddSingleton<IBackgroundTaskQueue, BackgroundTaskQueue>();
builder.Services.AddHostedService<QueuedHostedService>();
builder.Services.AddHostedService<MaintenanceBackgroundWorker>();

// Register Security & Password Hashing Services
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAccountService, AccountService>();

// Register Core Domain & Catalog Services
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IMediaService, MediaService>();
builder.Services.AddSingleton<IShippingService, ShippingCalculationService>();
builder.Services.AddSingleton<IPromoService, PromoCodeService>();
builder.Services.AddSingleton<IOtpVerificationService, OtpVerificationService>();

// Register Payment Engine & Egyptian Payment Channels
builder.Services.Configure<PayPalSettings>(builder.Configuration.GetSection(PayPalSettings.SectionName));
builder.Services.PostConfigure<PayPalSettings>(settings =>
{
    var frontendUrl = builder.Configuration["FrontendUrl"] ?? builder.Configuration["FRONTEND_URL"];
    if (!string.IsNullOrWhiteSpace(frontendUrl))
    {
        var trimmed = frontendUrl.Trim().TrimEnd('/');
        settings.ReturnUrl = $"{trimmed}/checkout/success";
        settings.CancelUrl = $"{trimmed}/checkout/cancel";
    }
});
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IPaymentProvider>(sp =>
{
    var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
    var httpClient = httpClientFactory.CreateClient("PayPal");
    var settings = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<PayPalSettings>>();
    var logger = sp.GetService<ILogger<PayPalPaymentProvider>>();
    return new PayPalPaymentProvider(httpClient, settings, logger);
});
builder.Services.AddSingleton<IPaymentProvider, CashOnDeliveryPaymentProvider>();
builder.Services.AddSingleton<IPaymentProvider, FawryPaymentProvider>();
builder.Services.AddSingleton<IPaymentProvider, InstaPayPaymentProvider>();
builder.Services.AddSingleton<IPaymentProviderFactory, PaymentProviderFactory>();

// Configure JWT Authentication & Authorization
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? JwtTokenService.DefaultSecret;
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? JwtTokenService.DefaultIssuer;
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? JwtTokenService.DefaultAudience;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

builder.Services.AddAuthorization();

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

// Enable Dynamic CORS for React Web Frontend & Local Dev
var configuredOrigins = new List<string> { "http://localhost:5173", "http://localhost:3000" };
var frontendEnv = builder.Configuration["FrontendUrl"] ?? builder.Configuration["FRONTEND_URL"];
if (!string.IsNullOrWhiteSpace(frontendEnv))
{
    var cleanUrl = frontendEnv.Trim().TrimEnd('/');
    if (!configuredOrigins.Contains(cleanUrl))
    {
        configuredOrigins.Add(cleanUrl);
    }
}
var allowedOriginsSetting = builder.Configuration["AllowedOrigins"] ?? builder.Configuration["ALLOWED_ORIGINS"];
if (!string.IsNullOrWhiteSpace(allowedOriginsSetting))
{
    var extra = allowedOriginsSetting.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    foreach (var o in extra)
    {
        var clean = o.TrimEnd('/');
        if (!configuredOrigins.Contains(clean))
        {
            configuredOrigins.Add(clean);
        }
    }
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(configuredOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApi();

// Ensure static root and uploads directory exist prior to WebApplication initialization
var wwwrootDir = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
var uploadsDir = Path.Combine(wwwrootDir, "uploads");
if (!Directory.Exists(uploadsDir))
{
    Directory.CreateDirectory(uploadsDir);
}

var app = builder.Build();

// Resilient database initialization & migration seeding
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<SocialCommerceDbContext>();
        await DbInitializer.InitializeAsync(db);
        logger.LogInformation("Database initialized and verified successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing or seeding the database.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Lightweight Keep-Alive Endpoints for Render & Cron-job
app.MapGet("/ping", () => Results.Ok(new
{
    status = "healthy",
    service = "social-commerce-api",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow
})).AllowAnonymous();

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "social-commerce-api",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow
})).AllowAnonymous();

app.UseCors("AllowFrontend");
app.UseStaticFiles();

// Output Caching Middleware
app.UseOutputCache();

// Authentication & Authorization Pipeline
app.UseAuthentication();
app.UseAuthorization();

// Multi-Tenant Context Resolution
app.UseMiddleware<TenantResolutionMiddleware>();

// Map RESTful Controllers
app.MapControllers();

app.Run();

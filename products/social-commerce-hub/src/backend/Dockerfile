# ==========================================
# Multi-Stage Production Dockerfile: All-in-One Backend (.NET 10 + SQLite + Redis)
# Target: Render.com Containerized Web Service
# ==========================================

# 1. Build & Publish Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files for layer caching
COPY ["SocialCommerce.slnx", "./"]
COPY ["SocialCommerce.Domain/SocialCommerce.Domain.csproj", "SocialCommerce.Domain/"]
COPY ["SocialCommerce.Application/SocialCommerce.Application.csproj", "SocialCommerce.Application/"]
COPY ["SocialCommerce.Infrastructure/SocialCommerce.Infrastructure.csproj", "SocialCommerce.Infrastructure/"]
COPY ["SocialCommerce.Api/SocialCommerce.Api.csproj", "SocialCommerce.Api/"]
COPY ["SocialCommerce.Tests/SocialCommerce.Tests.csproj", "SocialCommerce.Tests/"]

# Restore dependencies
RUN dotnet restore "SocialCommerce.Api/SocialCommerce.Api.csproj"

# Copy source tree and compile release artifacts
COPY . .
WORKDIR /src/SocialCommerce.Api
RUN dotnet publish "SocialCommerce.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Production All-in-One Runtime Stage (.NET 10 + Redis 7)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Install Redis Server, curl (for keep-alive health checks) & procps
RUN apt-get update && \
    apt-get install -y --no-install-recommends redis-server curl procps && \
    rm -rf /var/lib/apt/lists/*

# Environment variables
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    PORT=8080 \
    ConnectionStrings__DefaultConnection="Data Source=/app/data/social_commerce.db" \
    ConnectionStrings__Redis="localhost:6379,abortConnect=false"

# Create persistent storage directories with full read/write permissions
RUN mkdir -p /app/data /app/wwwroot/uploads /var/log/redis /var/lib/redis && \
    chmod -R 777 /app/data /app/wwwroot/uploads /var/lib/redis

# Copy published .NET artifacts
COPY --from=build /app/publish .

# Expose Render default port
EXPOSE 8080

# Keep-Alive Healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/ping || exit 1

# Start Redis in background daemon mode, then launch .NET 10 Web API
CMD ["/bin/sh", "-c", "redis-server --daemonize yes && dotnet SocialCommerce.Api.dll"]

# TASK-0003 — Initialize Backend Solution Architecture (.NET 10 Clean Architecture)

## Metadata

| Field                | Value                                                              |
|----------------------|--------------------------------------------------------------------|
| **Task ID**          | TASK-0003                                                          |
| **Title**            | Initialize Backend Solution Architecture (.NET 10 Clean Architecture)|
| **Product**          | products/social-commerce-hub                                       |
| **Phase**            | Phase 2 — Backend Engineering & Solution Scaffolding               |
| **Status**           | PROPOSED                                                           |
| **Priority**         | High                                                               |
| **Estimated Effort** | Small / Medium                                                     |
| **Assigned To**      | Owner & Antigravity (Pair Programming / Collaborative)             |
| **Execution Mode**   | Owner implements core / AI assists or AI implements under owner direction |
| **Created**          | 2026-10-20                                                         |
| **Updated**          | 2026-10-20                                                         |

## Context

Following the approval of ADR-0001 and the requirements PRD for `Social-Commerce-Hub`, we must establish the official .NET 10 backend solution structure. The codebase will follow a Clean Modular Monolith architecture ensuring separation of concerns, testability, and decoupled payment integrations via `IPaymentProvider`.

## Scope

1. Create product folder: `products/social-commerce-hub/`.
2. Scaffold an isolated .NET 10 solution (`SocialCommerce.sln`) inside `products/social-commerce-hub/src/backend/`:
   - `SocialCommerce.Domain`: Core entities (`Merchant`, `Product`, `Order`, `Review`, `MerchantLedger`), domain enums, and domain events.
   - `SocialCommerce.Application`: Service contracts, DTOs, and the `IPaymentProvider` abstraction.
   - `SocialCommerce.Infrastructure`: EF Core PostgreSQL DbContext, data configurations, and PayPal payment provider implementation.
   - `SocialCommerce.Api`: ASP.NET Core Web API (Minimal APIs / Controllers), middleware, dependency injection registration, and OpenAPI/Swagger.
   - `SocialCommerce.Tests`: Unit and integration test project.
3. Configure solution-wide conventions:
   - Enable nullable reference types (`<Nullable>enable</Nullable>`).
   - Implicit usings enabled.
   - C# 13 / .NET 10 language baseline.

## Acceptance Criteria

1. [ ] Solution `SocialCommerce.sln` compiles successfully with 0 errors via `dotnet build`.
2. [ ] Projects are cleanly separated with one-way architectural dependencies:
       `Api` -> `Infrastructure` -> `Application` -> `Domain`.
3. [ ] `IPaymentProvider` and `PaymentProviderFactory` interfaces are declared in `Application.Payments`.
4. [ ] Core domain models (`Merchant`, `Product`, `Order`) are declared with proper encapsulation.
5. [ ] Project is strictly located under `products/social-commerce-hub/` per README §11.4 isolated workspace rules.
6. [ ] `STATE.md` updated to reflect TASK-0003 in progress and remains <= 50 lines.

## Dependencies and Constraints

- Requires .NET 10 SDK (verified: `10.0.401` installed).
- Zero paid external services; local development configuration only.

## Required Approvals

| Approval Type  | Status                 | Approval ID | Approver |
|----------------|------------------------|-------------|----------|
| Scope Approval | PENDING_OWNER_APPROVAL | APR-0006    | Owner    |

## Status History

| Date       | From Status | To Status | Notes                              |
|------------|-------------|-----------|------------------------------------|
| 2026-10-20 | —           | PROPOSED  | Task created for owner review      |

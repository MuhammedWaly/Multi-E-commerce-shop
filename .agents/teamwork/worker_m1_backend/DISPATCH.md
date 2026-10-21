## 2026-10-21T12:05:33Z
You are the Backend Implementation Worker for Milestone 1 (Multi-Channel Egyptian Payment Engine & Financial Ledger).
Your working directory is: d:\AI Software Company\.agents\teamwork\worker_m1_backend
Product directory: d:\AI Software Company\products\social-commerce-hub
Authoritative request: d:\AI Software Company\.agents\teamwork\ORIGINAL_REQUEST.md
Project blueprint: d:\AI Software Company\.agents\teamwork\orchestrator\PROJECT.md
Backend Survey Report: d:\AI Software Company\.agents\teamwork\explorer_survey_backend\survey_report.md
Backend Handoff Report: d:\AI Software Company\.agents\teamwork\explorer_survey_backend\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Objective:
Implement Milestone 1 per the specifications in ORIGINAL_REQUEST.md and the detailed blueprint in explorer_survey_backend/survey_report.md:
1. Domain:
   - Extend `OrderStatus` with `Pending = 4`, `AwaitingPayment = 5`, `Processing = 6`.
   - Extend `Order` entity with `PaymentMethod`, `PaymentReference`, `PaymentInstructions`, `PaymentExpiresAtUtc`, `SenderWalletOrReference`.
   - Update invariant guards in `Order.MarkAsPaid` and `Order.AssignPaymentOrderId` to allow payment transitions from `Pending`, `AwaitingPayment`, `Processing`, and `PendingPayment`.
   - Confirm fee calculation preserves 5% platform fee deduction (`PlatformFeeAmount`) and 95% merchant net amount (`MerchantNetAmount`).
2. Providers:
   - Implement `CashOnDeliveryPaymentProvider` implementing `IPaymentProvider` (ProviderName = "CashOnDelivery", returns order in Pending state with 0 upfront payment).
   - Implement `FawryPaymentProvider` implementing `IPaymentProvider` (ProviderName = "Fawry", generates simulated 8-digit bill reference like 98234710, 48-hour expiry, customer instructions, settlement simulation).
   - Implement `InstaPayPaymentProvider` implementing `IPaymentProvider` (ProviderName = "InstaPay", records customer sender wallet / transaction reference, transitions order to Processing).
   - Update `PaymentProviderFactory` and register all providers in `Program.cs`.
3. Order Service & Controller:
   - Update `CreateOrderRequest` to accept `PaymentMethod` (defaulting to "PayPal" for backward compatibility) and optional `SenderWalletOrReference`.
   - Update `OrderService.CreateOrderAsync` to dynamically resolve provider via `_paymentFactory.GetProvider(order.PaymentMethod)` instead of hardcoded default.
   - Update `OrderService.CaptureOrderAsync` to support capturing/settling Fawry, InstaPay, and COD orders, recording double-entry ledger entries (`CreditSale` and `FeeDeduction`) in `MerchantLedgerEntries`, and crediting merchant net balance.
   - Add endpoint in `OrdersController` (or `/api/orders/{id}/capture` or `/api/orders/fawry/settle`) for simulated Fawry settlement.
   - Update DTOs (`OrderDto`, `CustomerOrderDto`, `MerchantOrderDto`, `AdminOrderDto`) to include `PaymentMethod`, `SettlementStatus`, `PaymentReference`, and instructions.
4. Database Initializer:
   - Update `DbInitializer.cs` to add SQLite columns (`PaymentMethod`, `PaymentReference`, `PaymentInstructions`, `PaymentExpiresAtUtc`, `SenderWalletOrReference`) safely via `ALTER TABLE Orders ADD COLUMN ...` wrapped in try/catch.
5. Unit & Integration Tests:
   - Add new tests in `src/backend/SocialCommerce.Tests/EgyptianPaymentProviderTests.cs` and `EgyptianPaymentOrderServiceTests.cs`.
   - Verify all 52 existing tests continue to pass with 0 failures, plus all new tests pass!

Exclusive File Ownership:
Files in `src/backend/**`. Do NOT edit files in `src/frontend/**`.

Verification Command:
`dotnet test "src/backend/SocialCommerce.Tests/SocialCommerce.Tests.csproj"`

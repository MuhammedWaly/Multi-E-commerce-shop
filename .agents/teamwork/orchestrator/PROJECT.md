# Project: Social-Commerce-Hub Local Egyptian Payment Gateways & Bilingual Checkout

## Architecture
- **Backend**: ASP.NET Core (.NET 10.0), EF Core SQLite, Clean Architecture (Domain, Application, Infrastructure, Api, Tests).
  - Domain: `Order`, `OrderStatus`, `MerchantLedgerEntry`.
  - Application: `IPaymentProvider`, `IPaymentProviderFactory`, Order DTOs.
  - Infrastructure: `PaymentProviderFactory`, `PayPalPaymentProvider`, `CashOnDeliveryPaymentProvider`, `FawryPaymentProvider`, `InstaPayPaymentProvider`, `OrderService`, `AdminService`, `DbInitializer`.
  - Api: `OrdersController` (`POST /api/orders`, `POST /api/orders/{id}/capture`, `POST /api/orders/{id}/fawry/settle`).
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite.
  - State & i18n: `LanguageContext` (Arabic RTL / English LTR), `translations.ts` dictionary (1,430+ lines, full bilingual symmetry).
  - Checkout UI: `CartSlideOver.tsx` multi-channel selector (COD, Fawry, InstaPay/Mobile Wallets, PayPal) & receipt modals.
  - Portals: `MerchantDashboard.tsx` (channel & settlement status), `AdminPortal.tsx` (GMV & 5% fee revenue across channels, channel filter pills).
- **E2E Testing**: xUnit backend test suite (207 tests, 100% pass) + `verify-challenger2.js` (26 tests, 0 warnings).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | COD Engine | Cash on Delivery provider: zero upfront payment, initial state Pending | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Fawry Pay Engine | Fawry reference billing: simulated 8-digit reference, expiry, AwaitingPayment state, settlement simulation | M1 | ORIGINAL_REQUEST §R1 |
| 3 | InstaPay / Mobile Wallets | Mobile wallet/InstaPay provider: sender mobile/reference entry, Processing state, settlement capture | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Dynamic Order Routing | OrderService resolves provider via PaymentProviderFactory based on selected payment method | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Financial Ledger & Fees | Automatic 5% platform fee deduction, 95% merchant net disbursement, double-entry ledger on settlement | M1 | ORIGINAL_REQUEST §R2 |
| 6 | Schema Migration | SQLite safe column additions in DbInitializer for payment fields | M1 | survey |
| 7 | Bilingual Translations | Complete Arabic (RTL) & English (LTR) dictionary entries in translations.ts without hardcoded strings | M2 | ORIGINAL_REQUEST §R3 |
| 8 | Multi-Channel Cart Checkout | CartSlideOver payment method selection radio cards for COD, Fawry, InstaPay/Wallets, PayPal | M2 | ORIGINAL_REQUEST §R1, AC |
| 9 | Rich Receipts & Settlement UI | Fawry 8-digit code display + instructions + instant simulated settlement button; COD delivery instructions | M2 | ORIGINAL_REQUEST §R1, AC |
| 10 | Merchant Dashboard Display | Orders table displays Payment Channel and Settlement Status columns; localized labels | M2 | ORIGINAL_REQUEST §R2, AC |
| 11 | Admin Portal Counters & Audit | Orders audit displays payment channel; GMV and 5% fee counters update across all channels | M2 | ORIGINAL_REQUEST §R2, AC |
| 12 | 4-Tier E2E Test Suite | Automated test suite covering Feature Coverage, Boundaries, Cross-Feature, and Real-World Scenarios | E2E-TEST | survey |
| 13 | Full Integration & Non-Regression | Verify all 52 existing tests pass, new tests pass, npm run build succeeds, 100% E2E test pass | M3 | ORIGINAL_REQUEST §Verification |
| 14 | Adversarial Hardening | Challenger edge case stress-testing and Forensic Integrity Audit verification | M3 | Project Pattern Tier 5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Payment Engine & Ledger | Domain models, providers (COD, Fawry, InstaPay), OrderService routing, 5% fee & 95% ledger, DbInitializer | none | DONE (89/89 tests passed) |
| M2 | Frontend Bilingual Checkout & Portals | CartSlideOver payment selector, Fawry settlement UI, bilingual translations, Merchant & Admin portals | M1 (contracts) | DONE (npm run build passed, 0 errors) |
| E2E-TEST | E2E Testing Track | Requirement-driven 4-tier test suite, assertions, and verification runner, publishing TEST_READY.md | none | DONE (174/174 tests passed) |
| M3 | Final Integration & Adversarial Gate | Pass 100% E2E test suite, adversarial coverage hardening (Tier 5), forensic integrity audit | M1, M2, E2E-TEST | DONE (207/207 tests passed, Gate Result: PASS) |

## Interface Contracts
### Frontend ↔ Backend Orders API
- `POST /api/orders`
  - Request:
    ```json
    {
      "items": [{ "productId": 1, "quantity": 2 }],
      "shippingAddress": "15 Tahrir Square, Cairo",
      "paymentMethod": "CashOnDelivery" | "Fawry" | "InstaPay" | "PayPal",
      "customerPhone": "01012345678",
      "senderWalletOrReference": "01012345678"
    }
    ```
  - Response:
    ```json
    {
      "orderId": 42,
      "orderNumber": "ORD-20261021-...",
      "status": "Pending" | "AwaitingPayment" | "Processing" | "PendingPayment",
      "totalAmount": 500.00,
      "platformFeeAmount": 25.00,
      "merchantNetAmount": 475.00,
      "paymentMethod": "CashOnDelivery" | "Fawry" | "InstaPay" | "PayPal",
      "paymentReference": "98234710",
      "paymentInstructions": "Pay at any Fawry kiosk using service code 788...",
      "paymentExpiresAtUtc": "2026-10-23T12:00:00Z"
    }
    ```
- `POST /api/orders/{id}/capture`
  - Request: `{ "transactionId": "...", "provider": "..." }`
  - Response: `{ "success": true, "status": "Paid", "capturedAmount": 500.00, "merchantNetAmount": 475.00 }`
- `POST /api/orders/{id}/fawry/settle`
  - Request: `{ "billReference": "98234710", "paidAmount": 500.00 }`
  - Response: `{ "success": true, "status": "Paid", "capturedAmount": 500.00, "merchantNetAmount": 475.00 }`

### Merchant & Admin Data Contracts
- `OrderDto`:
  - `string PaymentMethod`
  - `string SettlementStatus` ("Settled", "Pending Settlement", "Awaiting Cash Collection")
  - `string? PaymentReference`

## Code Layout
- Backend:
  - `src/backend/SocialCommerce.Domain/Entities/OrderStatus.cs`
  - `src/backend/SocialCommerce.Domain/Entities/Order.cs`
  - `src/backend/SocialCommerce.Application/Orders/Dtos/CreateOrderRequest.cs`
  - `src/backend/SocialCommerce.Application/Orders/Dtos/OrderDto.cs`
  - `src/backend/SocialCommerce.Application/Payments/IPaymentProvider.cs`
  - `src/backend/SocialCommerce.Infrastructure/Payments/Egyptian/CashOnDeliveryPaymentProvider.cs`
  - `src/backend/SocialCommerce.Infrastructure/Payments/Egyptian/FawryPaymentProvider.cs`
  - `src/backend/SocialCommerce.Infrastructure/Payments/Egyptian/InstaPayPaymentProvider.cs`
  - `src/backend/SocialCommerce.Infrastructure/Payments/PaymentProviderFactory.cs`
  - `src/backend/SocialCommerce.Infrastructure/Services/OrderService.cs`
  - `src/backend/SocialCommerce.Infrastructure/Persistence/DbInitializer.cs`
  - `src/backend/SocialCommerce.Api/Program.cs`
  - `src/backend/SocialCommerce.Api/Controllers/OrdersController.cs`
  - `src/backend/SocialCommerce.Tests/EgyptianPaymentProviderTests.cs`
  - `src/backend/SocialCommerce.Tests/EgyptianPaymentOrderServiceTests.cs`
  - `src/backend/SocialCommerce.Tests/EgyptianPaymentE2ETests.cs`
  - `src/backend/SocialCommerce.Tests/AdversarialStressTests.cs`
- Frontend:
  - `src/frontend/src/types.ts`
  - `src/frontend/src/i18n/translations.ts`
  - `src/frontend/src/services/api.ts`
  - `src/frontend/src/components/CartSlideOver.tsx`
  - `src/frontend/src/components/MerchantDashboard.tsx`
  - `src/frontend/src/components/AdminPortal.tsx`
  - `src/frontend/src/components/BuyerOrdersModal.tsx`
  - `src/frontend/scripts/verify-challenger2.js`

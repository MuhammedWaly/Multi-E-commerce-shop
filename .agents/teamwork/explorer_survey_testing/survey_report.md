# Testing Landscape & Architecture Survey Report
**Product**: Social-Commerce-Hub  
**Workspace**: `d:\AI Software Company\products\social-commerce-hub`  
**Date**: 2026-10-21  
**Author**: Testing & Architecture Survey Explorer  

---

## 1. Executive Summary

Social-Commerce-Hub is a social marketplace platform built with a .NET 10.0 Web API backend (`SocialCommerce.Api`, `Application`, `Domain`, `Infrastructure`, `Tests`) and a React 19 + TypeScript + Vite frontend (`src/frontend`).

This survey establishes the complete testing landscape, audits the existing 52 backend tests, analyzes the frontend build and typecheck pipeline, and defines a comprehensive **4-Tier Test Matrix** for the new Egyptian Payment System (Cash on Delivery, Fawry Pay 8-digit reference billing, InstaPay & Mobile Wallets, and PayPal parity with 5% platform fee / 95% net disbursement). Furthermore, it specifies the test infrastructure and automation architecture required for the upcoming testing and implementation tracks.

---

## 2. Existing Backend Test Suite Survey

### 2.1 Project Configuration & Dependencies
The backend test project is located at:
`src/backend/SocialCommerce.Tests/SocialCommerce.Tests.csproj`

- **Target Framework**: `.NET 10.0` (`net10.0`)
- **Implicit Usings**: `enable`
- **Nullable**: `enable`
- **Test Runner & Core Packages**:
  - `Microsoft.NET.Test.Sdk` (v17.14.1)
  - `xunit` (v2.9.3)
  - `xunit.runner.visualstudio` (v3.1.4)
  - `coverlet.collector` (v6.0.4)
- **Project References**:
  - `SocialCommerce.Application.csproj`
  - `SocialCommerce.Api.csproj`
  - Transitively: `SocialCommerce.Domain.csproj` and `SocialCommerce.Infrastructure.csproj`
- **Mocking Strategy**:
  - **No external mocking frameworks** (e.g., Moq, NSubstitute, FakeItEasy) are used or referenced.
  - Test suites utilize **concrete domain entities**, **in-memory SQLite databases** (`Microsoft.Data.Sqlite` with `"DataSource=:memory:"`), and lightweight stubs/null objects (e.g., `NullLogger<T>.Instance`, `ConfigurationBuilder`).
  - This ensures fast test execution, zero mock-setup overhead, and high test fidelity against actual database and domain rules.

### 2.2 Execution Baseline
- **Execution Command**:
  ```powershell
  dotnet test "src/backend/SocialCommerce.Tests/SocialCommerce.Tests.csproj"
  ```
- **Observed Result**:
  - **Total Tests**: 52
  - **Passed**: 52
  - **Failed**: 0
  - **Skipped**: 0
  - **Execution Duration**: ~4.0 seconds

### 2.3 Comprehensive Catalog of Existing 52 Tests

| # | Test Class | Test Method Name | What It Verifies |
|---|------------|------------------|------------------|
| 1 | `ApiResponseAndFilterTests` | `ApiResponse_Ok_SetsPropertiesCorrectly` | Verifies generic API envelope sets success=true, payload data, and message correctly. |
| 2 | `ApiResponseAndFilterTests` | `ApiResponse_Fail_SingleError_SetsPropertiesCorrectly` | Verifies failure envelope with single error string. |
| 3 | `ApiResponseAndFilterTests` | `ApiResponse_Fail_MultipleErrors_SetsPropertiesCorrectly` | Verifies failure envelope with list of error strings. |
| 4 | `ApiResponseAndFilterTests` | `ApiExceptionFilter_ArgumentException_Returns400WithEnvelope` | Verifies exception filter converts `ArgumentException` into HTTP 400 Bad Request with standardized envelope. |
| 5 | `ApiResponseAndFilterTests` | `ApiExceptionFilter_InvalidOperationException_Returns400WithEnvelope` | Verifies filter converts `InvalidOperationException` into HTTP 400 Bad Request with business error message. |
| 6 | `ApiResponseAndFilterTests` | `ApiExceptionFilter_KeyNotFoundException_Returns404WithEnvelope` | Verifies filter converts `KeyNotFoundException` into HTTP 404 Not Found. |
| 7 | `ApiResponseAndFilterTests` | `ValidateModelAttribute_InvalidModelState_SetsBadRequestResultWithEnvelope` | Verifies action filter catches model state validation failures and responds with HTTP 400. |
| 8 | `AuthAndIdentityTests` | `PasswordHasher_HashesAndVerifiesPasswordCorrectly` | Validates PBKDF2 SHA-256 password hashing with cryptographic salt generation and verification. |
| 9 | `AuthAndIdentityTests` | `JwtTokenService_GeneratesValidToken_WithMerchantClaims` | Validates JWT generation containing merchant ID, role, and store slug claims. |
| 10 | `AuthAndIdentityTests` | `User_RequiresValidEmail_AndMerchantIdForMerchantRole` | Domain invariant: User requires email format and enforces non-null `MerchantId` when role is `Merchant`. |
| 11 | `AuthAndIdentityTests` | `AuthService_RegistersCustomerAndMerchant_Successfully` | In-memory integration test: customer registration, merchant registration with store, login, duplicate email prevention. |
| 12 | `DomainEntitiesTests` | `Merchant_Creation_Should_Succeed_With_Valid_Data` | Validates initial merchant entity state: active=true, balance=0, GUID assigned. |
| 13 | `DomainEntitiesTests` | `Merchant_Creation_Should_Throw_On_Empty_Parameters(name="", ...)` | Theory: Validates rejection of empty store name. |
| 14 | `DomainEntitiesTests` | `Merchant_Creation_Should_Throw_On_Empty_Parameters(slug="", ...)` | Theory: Validates rejection of empty slug. |
| 15 | `DomainEntitiesTests` | `Merchant_Creation_Should_Throw_On_Empty_Parameters(email="", ...)` | Theory: Validates rejection of empty email. |
| 16 | `DomainEntitiesTests` | `Merchant_Payout_Should_Throw_When_Exceeding_Balance` | Invariant: Merchant payout deduction cannot exceed current balance. |
| 17 | `DomainEntitiesTests` | `Product_Creation_Should_Succeed_And_DeductStock_Properly` | Validates initial product stock and stock reduction invariants (throws on insufficient stock). |
| 18 | `DomainEntitiesTests` | `Product_Price_Update_Should_Throw_On_Negative_Value` | Invariant: Price update rejects negative amounts. |
| 19 | `MediaUploadTests` | `MediaService_SavesValidImage_Successfully` | Verifies image storage, GUID naming, and `/uploads/media_*` URL generation. |
| 20 | `MediaUploadTests` | `MediaService_SavesValidVideo_AndDetectsVideoFlag` | Verifies video MIME detection, video flag assignment, and MP4 persistence. |
| 21 | `MediaUploadTests` | `MediaService_RejectsUnsupportedExtension` | Verifies rejection of executable files (`.exe`). |
| 22 | `MediaUploadTests` | `MediaService_RejectsOversizedImage` | Verifies rejection of files exceeding the 15MB size limit. |
| 23 | `OrderDomainTests` | `Order_Creation_Should_Calculate_Totals_And_Fees_Accurately` | Core financial invariant: TotalAmount = sum(items), PlatformFeeAmount = 5% (rounded), MerchantNetAmount = 95%. |
| 24 | `OrderDomainTests` | `Order_Creation_Should_Throw_On_Empty_Items` | Invariant: Order creation rejects empty item collections. |
| 25 | `OrderDomainTests` | `Order_MarkAsPaid_Should_Transition_Status_And_Set_TransactionId` | Verifies transition from `PendingPayment` to `Paid`, recording `PaidAtUtc` and `PaymentTransactionId`. |
| 26 | `OrderDomainTests` | `Order_Status_Transitions_Should_Enforce_Invariants` | Verifies order cannot be fulfilled before being paid, and fulfilled order cannot be cancelled. |
| 27 | `OrderDomainTests` | `MerchantLedgerEntry_Should_Validate_Parameters` | Verifies ledger entry initialization and rejection of negative payout amounts. |
| 28 | `OrderServiceTests` | `CreateOrderAsync_Should_Deduct_Stock_And_Assign_PaymentOrderId` | Integration test: OrderService deducts product stock, assigns `PaymentOrderId` from PayPal provider, computes 5%/95% splits. |
| 29 | `OrderServiceTests` | `CaptureOrderAsync_Should_Mark_Order_Paid_And_Credit_Merchant_And_Record_Ledger` | Integration test: Order capture marks order `Paid`, credits merchant balance by 95%, records `CreditSale` and `FeeDeduction` ledger entries. |
| 30 | `OrderServiceTests` | `GetMerchantDashboardAsync_Should_Calculate_Totals_Accurately` | Integration test: Verifies merchant dashboard KPIs (gross sales, net earnings, platform fees, orders count). |
| 31 | `OrderServiceTests` | `UpdateOrderStatusAsync_Should_Transition_Status_To_Fulfilled` | Integration test: Verifies order status transition to `Fulfilled`. |
| 32 | `PaymentProviderTests` | `PayPal_CreatePaymentOrder_Should_Return_ApprovalUrl_When_Amount_Valid` | Verifies PayPal sandbox order ID generation (`PAYPAL-ORDER-...`) and approval URL. |
| 33 | `PaymentProviderTests` | `PayPal_CreatePaymentOrder_Should_Fail_When_Amount_Is_Zero_Or_Negative` | Verifies rejection of zero or negative amounts with error message. |
| 34 | `PaymentProviderTests` | `PaymentProviderFactory_Should_Resolve_PayPal_As_Default` | Verifies `PaymentProviderFactory.GetDefaultProvider()` resolves PayPal. |
| 35 | `ProductManagementAndSearchTests` | `UpdateProduct_AllowsOwner_AndUpdatesDetails` | Verifies product editing by authorized store owner. |
| 36 | `ProductManagementAndSearchTests` | `UpdateProduct_BlocksCrossStoreEdit` | Multi-tenancy guard: blocks cross-store editing with `UnauthorizedAccessException`. |
| 37 | `ProductManagementAndSearchTests` | `DeleteProduct_RemovesProductForOwner` | Verifies product deletion by owner and removal from DB. |
| 38 | `ProductManagementAndSearchTests` | `Search_RanksExactAndContainsMatches_Correctly` | Verifies search scoring for exact and substring matches without fuzzy fallback. |
| 39 | `ProductManagementAndSearchTests` | `Search_FallsBackToNearestFuzzyMatch_WhenTypoOccurs` | Verifies fuzzy search fallback and suggested query generation for typos. |
| 40 | `ReviewServiceTests` | `AddReviewAsync_Should_Succeed_For_Verified_Purchase_And_Recalculate_Average` | Verifies verified buyer review submission and product aggregate rating recalculation. |
| 41 | `ReviewServiceTests` | `AddReviewAsync_Should_Throw_When_Order_Is_Not_Paid` | Review guard: Rejects review if order is not paid. |
| 42 | `ReviewServiceTests` | `AddReviewAsync_Should_Throw_When_Email_Mismatch` | Review guard: Rejects review if buyer email does not match order email. |
| 43 | `UnitTest1` | `Test1` | Default template unit test stub (empty assertion). |
| 44 | `UserAccountAndSecurityTests` | `GetProfileAsync_ReturnsCorrectUserProfile` | Verifies retrieval of user account profile details. |
| 45 | `UserAccountAndSecurityTests` | `UpdateProfileAsync_UpdatesFullNamePhoneAndAvatar` | Verifies updating full name, phone number, and avatar URL. |
| 46 | `UserAccountAndSecurityTests` | `ChangePasswordAsync_WithValidCurrentPassword_ChangesPasswordSuccessfully` | Verifies password change flow and re-hashing. |
| 47 | `UserAccountAndSecurityTests` | `ChangePasswordAsync_WithInvalidCurrentPassword_ThrowsArgumentException` | Verifies rejection of incorrect current password. |
| 48 | `UserAccountAndSecurityTests` | `ForgotPasswordAndResetPassword_FlowWorksEndToEnd` | Verifies reset token generation, expiry date, and password reset flow. |
| 49 | `UserAccountAndSecurityTests` | `ResetPassword_WithExpiredToken_ThrowsInvalidOperationException` | Invariant: Rejects expired password reset tokens. |
| 50 | `UserAccountAndSecurityTests` | `ConfirmEmailAsync_WithValidToken_MarksEmailAsConfirmed` | Verifies email confirmation token verification and flag update. |
| 51 | `UserAccountAndSecurityTests` | `ConfirmEmailAsync_WithInvalidToken_ThrowsInvalidOperationException` | Verifies rejection of invalid email confirmation tokens. |
| 52 | `UserAccountAndSecurityTests` | `ResendConfirmationEmail_DispatchesNewToken` | Verifies dispatch of new confirmation token. |

### 2.4 Non-Regression Constraints
To ensure backward compatibility and zero regressions:
1. **Existing 52 Tests Must Pass**: Under no circumstances should existing tests be deleted or altered to weaken assertions. All 52 must pass with 0 failures on every build.
2. **PaymentProviderFactory Contract**: Existing call `_paymentFactory.GetDefaultProvider()` returns `PayPal`. Any new providers (`Fawry`, `InstaPay`, `CashOnDelivery`) must register with distinct provider names (`ProviderName`), while preserving PayPal as a valid provider.
3. **5% Fee & 95% Net Invariant**:
   - Platform fee must remain strictly `Math.Round(TotalAmount * 0.05m, 2)`.
   - Merchant net disbursement must remain strictly `TotalAmount - PlatformFeeAmount`.
   - Both `CreditSale` and `FeeDeduction` ledger entries must continue to be recorded upon payment capture/settlement.
4. **Order Domain Status Constraints**:
   - Status transitions must enforce: only `Paid` orders can be marked `Fulfilled`.
   - Fulfilled orders cannot be cancelled.
   - Any new payment statuses (such as `Pending` or `AwaitingPayment`) must respect order fulfillment rules.

---

## 3. Frontend Build & Test Suite Survey

### 3.1 Frontend Stack & Toolchain
- **Directory**: `src/frontend`
- **Framework**: React 19 (`react` ^19.3.1, `react-dom` ^19.3.1)
- **Bundler & Dev Server**: Vite 8.3.4 (`@vitejs/plugin-react` ^6.1.2)
- **Language**: TypeScript (~6.0.3)
- **Styling**: Tailwind CSS 4 (`@tailwindcss/vite` ^4.3.3, `tailwindcss` ^4.3.3)
- **Linter**: Oxlint 1.88.0 (`oxlint`)

### 3.2 Verification Commands & Observations
- **Typecheck & Production Build**:
  ```powershell
  cd src/frontend
  npm run build
  ```
  - **Result**: Success (Code 0).
  - **Output**: 37 modules transformed, built in ~450ms.
    - `dist/index.html` (0.46 kB)
    - `dist/assets/index-Cxjt5x6L.css` (76.48 kB)
    - `dist/assets/index-DJI4umau.js` (428.84 kB)
  - **TypeScript Verification**: `tsc -b` completes with 0 errors.

- **Linter**:
  ```powershell
  cd src/frontend
  npm run lint
  ```
  - **Result**: 17 errors, 11 warnings flagged by `oxlint`.
  - **Primary Cause**: Conditional React 19 Hook calls inside `MerchantDashboard.tsx` (`useState` and `useEffect` located after conditional early-return checks).

### 3.3 Frontend Checkout Architecture Analysis
- **Current Component**: `src/frontend/src/components/CartSlideOver.tsx`
  - Currently only exposes a single PayPal checkout button: `💳 {t.cart.checkoutPaypal}`.
  - Automatically captures payment via hardcoded `'PAYER-WEB-MARKETPLACE'`.
  - Does not currently offer payment method selection for Cash on Delivery, Fawry Pay, or InstaPay / Mobile Wallets.
- **Internationalization (i18n)**:
  - Managed via `LanguageContext.tsx` and `translations.ts` supporting `'en'` (LTR) and `'ar'` (RTL).
  - Formats currencies using `formatCurrency(amount)`: outputs `1,250 EGP` in English and `١,٢٥٠ ج.م` in Arabic.
  - The `cart` translation dictionary currently only defines generic keys (`title`, `emptyTitle`, `subtotal`, `shipping`, `freeShipping`, `platformFee`, `total`, `checkoutPaypal`, `paypalProcessing`, `paypalSuccess`, `secureNotice`, `clearCart`).
  - **Required Enhancement**: Add translation keys in both English and Arabic for COD, Fawry reference codes, InstaPay/Mobile Wallets, payment instructions, validation errors, and confirmation screens.

---

## 4. Egyptian Payment System Test Matrix across 4 Tiers

### Tier 1: Feature Coverage (Core Happy Paths)

| Test ID | Area | Test Case / Scenario | Expected Outcome |
|---------|------|----------------------|------------------|
| **T1-01** | Backend Domain | Create Order with Payment Method `CashOnDelivery` | Order created in `Pending` state, upfront digital payment = 0, stock deducted, `TotalAmount`, `PlatformFeeAmount` (5%), and `MerchantNetAmount` (95%) calculated accurately. |
| **T1-02** | Backend Service | Create Order with Payment Method `Fawry` | Generates 8-digit bill reference number (e.g. `84910248`), status set to `AwaitingPayment`, expiry timestamp set (e.g. +72 hours), reference stored in `PaymentOrderId`. |
| **T1-03** | Backend Gateway | Settle Fawry Order via Settlement Callback / Capture | When valid 8-digit reference is settled, order transitions to `Paid`, `PaymentTransactionId` recorded, merchant balance credited 95%, 2 ledger entries created (`CreditSale`, `FeeDeduction`). |
| **T1-04** | Backend Service | Create Order with Payment Method `InstaPay` / `MobileWallet` | Order accepts sender wallet/phone number (e.g. Vodafone Cash `01012345678`) and transaction reference. Order status set to `Pending` / `AwaitingPayment`. |
| **T1-05** | Backend Gateway | Verify & Settle InstaPay / Mobile Wallet Order | Capturing order with valid reference transitions order to `Paid`, updates merchant balance and ledger. |
| **T1-06** | Backend Gateway | PayPal Sandbox Flow Parity | Existing PayPal checkout continues to generate approval URL, accepts capture with PayerId, and marks order `Paid`. |
| **T1-07** | Financial Math | Platform Fee (5%) & Merchant Net (95%) Calculation | For order of 1,000 EGP: fee = 50.00 EGP, net = 950.00 EGP. For order of 650 EGP: fee = 32.50 EGP, net = 617.50 EGP. |
| **T1-08** | Frontend UI | Cart Slide-over Payment Method Selector | Buyer can toggle between COD, Fawry Pay, Mobile Wallets / InstaPay, and PayPal. Method details adapt dynamically. |
| **T1-09** | Frontend i18n | Bilingual RTL & LTR Checkout Experience | All payment option names, instructions, and receipts render in Arabic when `language === 'ar'` (RTL direction) and English when `language === 'en'` (LTR direction). |

### Tier 2: Boundary & Corner Cases

| Test ID | Area | Test Case / Scenario | Expected Outcome |
|---------|------|----------------------|------------------|
| **T2-01** | Validation | Order with Zero or Negative Total Amount | Creation rejected with `ArgumentException` / HTTP 400 Bad Request. |
| **T2-02** | Gateway | Payment Order Request with Amount <= 0 | All gateways (COD, Fawry, InstaPay, PayPal) return `IsSuccess = false` and rejection message. |
| **T2-03** | Fawry Gateway | Invalid Fawry Reference Format | Settlement with non-8-digit reference (e.g., 7 digits, 9 digits, alphanumeric characters) rejected with validation error. |
| **T2-04** | Fawry Gateway | Expired Fawry Bill Reference Code | Settlement of an expired reference (expiry date < UtcNow) rejected; order remains unpaid or transitions to `Cancelled`. |
| **T2-05** | Fawry Gateway | Non-Existent Fawry Reference Code | Settlement with reference code not matching any active order returns 404 or `IsSuccess = false`. |
| **T2-06** | Wallet Gateway | Malformed Mobile Wallet / Phone Number | Entering invalid Egyptian phone number (e.g. `12345`, `01912345678`, or empty) rejected with format validation error. |
| **T2-07** | Financial Math | Decimal Rounding & Fractional Currency Conservation | Test total amounts with fractional cents (e.g., 19.99 EGP, 33.33 EGP, 0.01 EGP). Invariant: `PlatformFeeAmount + MerchantNetAmount == TotalAmount` must always hold without penny loss. |
| **T2-08** | Gateway | Replay Attack / Double Settlement Prevention | Attempting to capture or settle an already `Paid` order or already-settled reference rejected with `InvalidOperationException`. |
| **T2-09** | Security | Cross-Tenant Settlement Isolation | Merchant A cannot settle or modify an order belonging to Merchant B (enforced by multi-tenant isolation). |
| **T2-10** | Stock Invariant | Stock Exhaustion during Order Placement | If product stock is 2 and customer orders 3, order creation fails with `InvalidOperationException`, 0 orders created, 0 stock deducted. |

### Tier 3: Cross-Feature Combinations

| Test ID | Area | Test Case / Scenario | Expected Outcome |
|---------|------|----------------------|------------------|
| **T3-01** | Multi-Item | Multi-Item Cart Checkout across Categories | Cart with 3 different items (e.g. linen dress, leather bag, scarf) correctly sums total, deducts stock for all 3, calculates single 5% platform fee and 95% net disbursement. |
| **T3-02** | Lifecycle | Status Transition Invariant Matrix | Enforces state machine: `Pending`/`AwaitingPayment` -> `Paid` -> `Fulfilled`. Attempting to fulfill an unpaid order throws `InvalidOperationException`. |
| **T3-03** | Financial Parity | Merchant Balance vs Ledger Double-Entry Parity | Sum of `MerchantLedgerEntry` credits minus debits strictly equals `Merchant.Balance` after multiple mixed-method orders (COD, Fawry, InstaPay, PayPal). |
| **T3-04** | Financial Parity | Admin Portal GMV & Fee Revenue Reconciliation | Admin `PlatformOverview`: `TotalGrossSales` equals sum of `TotalAmount` for all settled orders; `TotalPlatformRevenue` equals sum of `PlatformFeeAmount`; `TotalMerchantDisbursements` equals sum of `MerchantNetAmount`. |
| **T3-05** | Customer Portal | Buyer Orders Portal Reflection | Newly placed orders across all payment channels appear in `GET /api/orders/my-orders` and `BuyerOrdersModal` with proper status badges and gateway reference codes. |
| **T3-06** | Social / Reviews | Verified Review Eligibility Unlocking | Orders paid via Fawry, InstaPay, COD (settled), or PayPal unlock the "Leave Review" button; orders pending payment cannot submit verified reviews. |

### Tier 4: Real-World Scenarios

| Scenario ID | Name | Step-by-Step Flow | Verification Criteria |
|-------------|------|-------------------|-----------------------|
| **T4-01** | Complete Fawry Lifecycle | 1. Customer adds "Linen Shirt" (500 EGP) to cart.<br>2. Selects Fawry Pay at checkout.<br>3. Receives 8-digit bill code `84920199` with 72h expiry.<br>4. Fawry kiosk webhook/endpoint executes settlement.<br>5. Merchant views Dashboard: balance increases by 475 EGP (95%), 2 ledger entries added.<br>6. Admin checks Portal: GMV increases by 500 EGP, fee revenue increases by 25 EGP. | Order status = `Paid`<br>Ledger `CreditSale` = 500 EGP<br>Ledger `FeeDeduction` = 25 EGP<br>Merchant balance = +475 EGP<br>Admin GMV = +500 EGP |
| **T4-02** | InstaPay / Mobile Wallet Lifecycle | 1. Customer checks out "Leather Shoes" (1,000 EGP) via Vodafone Cash.<br>2. Enters wallet number `01001234567` and reference `VFC-778899`.<br>3. Order created in processing state.<br>4. Merchant/gateway confirms capture.<br>5. Merchant fulfills order via `Mark Dispatched`. | Order status transitions: `AwaitingPayment` -> `Paid` -> `Fulfilled`<br>Net earnings = 950 EGP<br>Platform fee = 50 EGP |
| **T4-03** | Cash on Delivery (COD) Lifecycle | 1. Customer checks out with Cash on Delivery.<br>2. Order created in `Pending` state with 0 upfront payment.<br>3. Merchant prepares shipment and dispatches.<br>4. Courier confirms payment delivery -> Order marked settled.<br>5. Merchant disbursement credited 95%, 5% fee recorded. | Order created with 0 digital charge<br>Fulfillment lifecycle intact<br>Disbursement deferred until delivery settlement |
| **T4-04** | Arabic (RTL) Seamless Checkout | 1. Buyer toggles platform to Arabic (`ar`).<br>2. Layout flips to RTL (`dir="rtl"`).<br>3. Opens Cart Slide-Over: sees Arabic labels (الدفع عند الاستلام، فوري، انستاباي/المحافظ الإلكترونية، باي بال).<br>4. Places Fawry order: displays Arabic payment instructions and reference code.<br>5. Order confirmation displays `ج.م` currency formatting without English fallback artifacts. | 100% Arabic strings<br>Proper RTL alignment and typography<br>Correct formatted currency (e.g., `٥٠٠ ج.م`) |

---

## 5. End-to-End (E2E) Test Architecture & Infrastructure Plan

To verify the entire payment processing pipeline without manual intervention, the testing architecture consists of three interlocking layers:

```
┌──────────────────────────────────────────────────────────┐
│              Layer 1: Unit & Domain Tests                │
│  - Egyptian Payment Provider Unit Tests                  │
│  - Math, rounding & currency invariant tests            │
│  - Reference generation & regex validation               │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│          Layer 2: Integration & DB Tests                 │
│  - SQLite in-memory full lifecycle tests                 │
│  - OrderService + PaymentProviderFactory integration     │
│  - Double-entry ledger audit & balance verification      │
│  - Merchant Dashboard & Admin Portal reconciliation      │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│          Layer 3: End-to-End Workflow & Build            │
│  - Automated CLI / API workflow runner script            │
│  - Frontend TypeScript compile (`tsc -b`) & Vite build   │
│  - Full bilingual i18n key consistency assertion         │
└──────────────────────────────────────────────────────────┘
```

### 5.1 Proposed Backend Test Classes to Add
In `src/backend/SocialCommerce.Tests`:
1. `EgyptianPaymentProviderTests.cs`:
   - Unit tests for `FawryPaymentProvider` (reference code generation, 8-digit format, expiration handling).
   - Unit tests for `InstaPayPaymentProvider` (phone number validation, transaction reference verification).
   - Unit tests for `CashOnDeliveryPaymentProvider` (zero upfront requirement, status initialization).
   - Invariant testing for `PaymentProviderFactory` resolving all providers by name.
2. `EgyptianPaymentOrderServiceTests.cs`:
   - Full in-memory database integration tests:
     - End-to-end checkout with COD -> order in `Pending` state -> stock deduction.
     - End-to-end checkout with Fawry -> 8-digit reference -> capture -> status `Paid` -> ledger double-entry (5% fee, 95% net).
     - End-to-end checkout with InstaPay -> capture -> status `Paid`.
     - Merchant dashboard KPI accuracy across mixed payment methods.
     - Admin platform overview reconciliation (GMV, platform fee revenue, total disbursements).
     - Decimal precision test cases (19.99 EGP, 33.33 EGP, etc.).

### 5.2 Verification Script Harness
A consolidated verification script (e.g. `scripts/verify-all.ps1` or `test-suite.bat`) that executes:
1. `dotnet test "src/backend/SocialCommerce.Tests/SocialCommerce.Tests.csproj"` (ensuring 52 existing + new tests pass).
2. `cd src/frontend && npm run build` (ensuring 0 TypeScript errors and clean production bundle).
3. Automated dictionary check to guarantee all checkout translation keys exist in both English and Arabic.

---

## 6. Execution Commands Reference

| Target | Command | Purpose |
|--------|---------|---------|
| **Backend Test Suite** | `dotnet test "src/backend/SocialCommerce.Tests/SocialCommerce.Tests.csproj"` | Executes all backend unit and integration tests. |
| **Backend Build Only** | `dotnet build "src/backend/SocialCommerce.slnx"` | Compiles all backend projects. |
| **Frontend Production Build** | `cd src/frontend && npm run build` | Compiles TypeScript and builds Vite bundle. |
| **Frontend Lint** | `cd src/frontend && npm run lint` | Runs `oxlint` rules against frontend files. |

---

## 7. Conclusion & Next Steps for Teamwork

1. **Backend Implementation Track**:
   - Introduce Egyptian payment provider models (`CashOnDeliveryPaymentProvider`, `FawryPaymentProvider`, `InstaPayPaymentProvider`) implementing `IPaymentProvider`.
   - Update `PaymentProviderFactory` to register and resolve all payment channels while preserving `PayPal` as default.
   - Extend `CreateOrderRequest` and `Order` domain entity to support payment method selection, Fawry reference generation, and status states (`Pending`, `AwaitingPayment`, `Paid`).
   - Implement settlement/capture logic ensuring exact 5% fee / 95% net disbursement and ledger recording.
2. **Frontend Implementation Track**:
   - Update `CartSlideOver.tsx` with a clean payment method selector (COD, Fawry, InstaPay/Wallets, PayPal).
   - Provide interactive guidance per method (Fawry 8-digit code instructions, InstaPay wallet reference entry).
   - Add all bilingual translation keys in `translations.ts` (`en` and `ar`) with zero hardcoded strings.
   - Update `BuyerOrdersModal`, `MerchantDashboard`, and `AdminPortal` to display the payment method and settlement details.
3. **Testing Track**:
   - Implement the test cases defined in the 4-Tier Test Matrix in `SocialCommerce.Tests`.
   - Ensure all 52 existing tests continue to pass with 0 failures.
   - Validate `npm run build` succeeds cleanly.

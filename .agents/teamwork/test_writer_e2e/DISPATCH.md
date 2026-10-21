## 2026-10-21T12:40:58Z
You are the E2E Test Writer for Social-Commerce-Hub Egyptian Payment Gateways & Financial Ledger.
Your working directory is: d:\AI Software Company\.agents\teamwork\test_writer_e2e
Product directory: d:\AI Software Company\products\social-commerce-hub
Authoritative request: d:\AI Software Company\.agents\teamwork\ORIGINAL_REQUEST.md
Project plan: d:\AI Software Company\.agents\teamwork\orchestrator\PROJECT.md
Testing Survey Report: d:\AI Software Company\.agents\teamwork\explorer_survey_testing\survey_report.md
Testing Handoff Report: d:\AI Software Company\.agents\teamwork\explorer_survey_testing\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All test implementations must be genuine. DO NOT write dummy assertions, tautological tests, or skip actual verification. A forensic auditor will independently verify your work.

Scope & Objective:
Implement a comprehensive, requirement-driven, opaque-box E2E test suite covering all features in PROJECT.md § Feature Inventory and ORIGINAL_REQUEST.md across 4 tiers:

1. Tier 1 - Feature Coverage (>=5 test cases per feature area):
   - Cash on Delivery (COD): initial Pending state, zero upfront payment, order creation, order tracking.
   - Fawry Pay: 8-digit bill reference generation, expiry, kiosk payment instructions, simulated settlement.
   - InstaPay / Mobile Wallets: customer sender wallet/reference entry, transition to processing/paid.
   - PayPal Parity: existing PayPal payment provider continues to work alongside Egyptian channels.
   - Financial Ledger: 5% platform fee deduction (PlatformFeeAmount) and 95% merchant net credit (MerchantNetAmount) calculated on every order.
   - Merchant Ledger Entries: atomic CreditSale and FeeDeduction entries recorded on settlement.
   - Admin Portal GMV & Platform Fee: accurate aggregation of revenue and fees across all payment channels.
   - Bilingual Experience: verify translation keys exist for both English and Arabic, RTL direction flags, and currency formatting (EGP / ج.م).

2. Tier 2 - Boundary & Corner Cases (>=5 test cases per feature area):
   - Zero or negative amount handling.
   - Invalid or malformed Fawry bill references (non-8-digit, non-numeric).
   - Expired Fawry reference settlement rejection.
   - Empty or malformed mobile wallet phone numbers.
   - Exact penny rounding (e.g., total = 99.99 EGP, fee = 5.00 EGP, net = 94.99 EGP).
   - Duplicate settlement replay protection (cannot pay an already Paid order twice).
   - Invariant guards on status transitions.

3. Tier 3 - Cross-Feature Combinations (pairwise interactions):
   - Multi-item carts across different merchants.
   - Order lifecycle transitions: Created -> Pending/AwaitingPayment -> Paid -> Fulfilled.
   - Merchant ledger balance parity: merchant total balance matches sum of net disbursements across all channels.
   - Admin GMV reconciliation: Admin overview totalGrossSales matches sum of settled orders across COD, Fawry, InstaPay, PayPal.
   - Customer order tracking & verified review unlocking upon delivery/fulfillment.

4. Tier 4 - Real-World Application Workloads:
   - Full end-to-end buyer checkout simulation: Buyer adds items -> selects Fawry -> gets 8-digit reference -> settles bill -> merchant receives 95% payout in ledger -> admin portal reflects GMV and 5% fee -> merchant marks order dispatched -> buyer confirms delivery.
   - Complete Cash on Delivery workflow: Buyer checks out COD -> order is Pending with 0 upfront digital payment -> merchant fulfills upon cash collection -> ledger credited.
   - Complete InstaPay workflow: Buyer provides wallet number 01012345678 and transaction reference IPN-20261021-9988 -> captured -> settled -> verified.

Implementation Location:
Implement test classes in `src/backend/SocialCommerce.Tests/` (e.g. `EgyptianPaymentE2ETests.cs`).
Ensure:
- All tests run and pass cleanly via `dotnet test "src/backend/SocialCommerce.Tests/SocialCommerce.Tests.csproj"`.
- All 52 original baseline tests + 37 provider tests continue to pass with 0 regressions.
- Create `TEST_READY.md` at `d:\AI Software Company\.agents\teamwork\orchestrator\TEST_READY.md` following the required Project Pattern template:
  - Test runner command
  - Expected: all tests pass with exit code 0
  - Coverage summary table (Tiers 1-4 with test counts)
  - Feature checklist table

Deliverables:
- Write test files in `src/backend/SocialCommerce.Tests/`.
- Run tests and verify 100% pass rate.
- Create `TEST_READY.md` with complete coverage summary.
- Write handoff report to `d:\AI Software Company\.agents\teamwork\test_writer_e2e\handoff.md`.
- Send message back to orchestrator upon completion.

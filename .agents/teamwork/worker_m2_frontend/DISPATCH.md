## 2026-10-21T12:06:10Z

You are the Frontend Implementation Worker for Milestone 2 (Bilingual Multi-Channel Checkout, Rich Receipts & Portal Integration).
Your working directory is: d:\AI Software Company\.agents\teamwork\worker_m2_frontend
Product directory: d:\AI Software Company\products\social-commerce-hub
Authoritative request: d:\AI Software Company\.agents\teamwork\ORIGINAL_REQUEST.md
Project blueprint: d:\AI Software Company\.agents\teamwork\orchestrator\PROJECT.md
Frontend Survey Report: d:\AI Software Company\.agents\teamwork\explorer_survey_frontend\survey_report.md
Frontend Handoff Report: d:\AI Software Company\.agents\teamwork\explorer_survey_frontend\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Objective:
Implement Milestone 2 per ORIGINAL_REQUEST.md and the detailed blueprint in explorer_survey_frontend/survey_report.md:
1. Types & API Client:
   - In `src/types.ts`: define `PaymentChannel` ('CashOnDelivery' | 'Fawry' | 'InstaPay' | 'PayPal'), `SettlementStatus`, extend `CreateOrderRequest` and `OrderDto`/`MerchantOrderDto`/`AdminOrderDto`.
   - In `src/services/api.ts`: update `createOrder` to pass `paymentMethod` and optional `senderWalletOrReference`. Add `simulateFawrySettlement(orderId: number, billReference: string)` or capture call.
2. Bilingual Translations (`src/i18n/translations.ts`):
   - Add complete English and Egyptian Arabic dictionaries for all payment channels, descriptions, inputs (phone, wallet address, transaction reference), payment instructions (Fawry kiosk service code 788, COD cash on delivery note), receipt labels, status badges, and settlement actions.
   - Audit and eliminate ALL hardcoded English strings across `CartSlideOver.tsx`, `MerchantDashboard.tsx`, `AdminPortal.tsx`, and `BuyerOrdersModal.tsx`.
   - Preserve LTR direction and monospace font for numbers, phone numbers, and reference codes (e.g., `font-mono dir="ltr"`).
3. Cart Slide-Over & Checkout (`src/components/CartSlideOver.tsx`):
   - Add interactive 4-channel Payment Method Selector (Cash on Delivery, Fawry Pay, InstaPay / Mobile Wallets, PayPal) with clean radio cards, badges, and channel-specific help text.
   - For COD: zero upfront digital payment requirement, clear cash on delivery notice, creates order in `Pending` state.
   - For Fawry: generates 8-digit reference code with expiry countdown/timestamp, step-by-step kiosk/app payment instructions, copy button, and an instant "Simulate Fawry Settlement" button transitioning the order to `Paid`.
   - For InstaPay / Mobile Wallets: input fields for sender mobile/wallet address and transaction reference, transitioning order to `Processing` / `AwaitingPayment`.
   - For PayPal: retain existing PayPal sandbox button/flow.
   - Rich Receipt Confirmation: display appropriate instructions, reference codes, and status per payment method.
4. Merchant Dashboard (`src/components/MerchantDashboard.tsx`):
   - Add `Payment Channel` column and `Settlement Status` column to the orders table.
   - Localize all labels and table headers via `LanguageContext`.
5. Admin Portal (`src/components/AdminPortal.tsx`):
   - Add `Payment Channel` column to orders audit table.
   - Verify that GMV (`totalGrossSales`) and 5% Platform Revenue (`totalPlatformRevenue`) aggregate accurately across all payment channels.
   - Localize all labels.
6. Build & Typecheck Verification:
   - Run `npm run build` in `src/frontend` and ensure 0 TypeScript or Vite build errors!

Exclusive File Ownership:
Files in `src/frontend/**`. Do NOT edit files in `src/backend/**`.

Verification Command:
`npm run build` in `src/frontend`.

Deliverables:
- Write detailed implementation report to `d:\AI Software Company\.agents\teamwork\worker_m2_frontend\changes.md`.
- Write handoff report to `d:\AI Software Company\.agents\teamwork\worker_m2_frontend\handoff.md`.
- Send message back to orchestrator upon completion.

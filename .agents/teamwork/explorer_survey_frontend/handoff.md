# Handoff Report: Frontend Survey for Local Egyptian Payment Gateways & Bilingual Checkout

**Author**: Frontend Survey Explorer (`explorer_survey_frontend`)  
**Workspace**: `d:\AI Software Company\products\social-commerce-hub`  
**Date**: 2026-10-21  
**Handoff Type**: Hard (Investigation complete)  

---

## 1. Observation

1. **Frontend Tech Stack and Build Health**:
   - `products/social-commerce-hub/src/frontend/package.json`: React `^19.3.1`, Tailwind CSS `@tailwindcss/vite` & `tailwindcss: ^4.3.3`, TypeScript `~6.0.3`, Vite `^8.3.4`.
   - Tool Command: `npm run build` in `src/frontend`.
   - Result: Exited with code 0 (`✓ 37 modules transformed`, built in 467ms, 0 errors, 0 warnings).
   - Tool Command: `dotnet test "src/backend/SocialCommerce.Tests/SocialCommerce.Tests.csproj"`.
   - Result: Exited with code 0 (`Passed! - Failed: 0, Passed: 52, Skipped: 0, Total: 52`).

2. **Current Checkout & Payment Implementation**:
   - `src/components/CartSlideOver.tsx`: Lines 45–69 and 285–301 show checkout currently hardcodes PayPal:
     ```tsx
     // Line 68:
     status: 'Paid (PayPal Sandbox Verified)'
     // Line 297:
     <span>💳 {t.cart.checkoutPaypal} ({formatCurrency(totalAmount)})</span>
     ```
   - No payment method selector exists. Cash on Delivery (COD), Fawry Pay, and InstaPay / Mobile Wallets are completely absent.
   - Line 258 contains hardcoded English text: `placeholder="Shipping Address (City, Street)"`.
   - Line 144 contains hardcoded English text: `Order ID: #{orderConfirmation.id}`.

3. **Current i18n & RTL/LTR System**:
   - `src/i18n/LanguageContext.tsx`: Manages language state (`'en' | 'ar'`), direction (`'ltr' | 'rtl'`), `isRTL`, and exposes `t`, `formatCurrency(val)` (outputs `ج.م` in Arabic and `EGP` in English), `formatNumber`, and `formatDate`.
   - `src/index.css`: Lines 16–34 configure `Cairo` font for `html[lang="ar"] body, html[dir="rtl"] body` and `Plus Jakarta Sans` for LTR, with `.ltr-text`, `input[type="email"]`, etc. configured for LTR alignment.
   - `src/i18n/translations.ts`: Contains complete bilingual structures for common, header, categories, hero, catalog, filters, product, search, storefront, reviews, auth, and account settings. However, `cart` only has PayPal keys (`checkoutPaypal`, `paypalProcessing`, `paypalSuccess`), lacking Egyptian payment channels, instructions, and settlement statuses.

4. **Merchant Dashboard & Admin Portal Orders Display**:
   - `src/components/MerchantDashboard.tsx`: Lines 498–540 render an orders table with columns: `OrderId`, `Customer`, `Items`, `Total`, `Net Payout`, `Status`, `Action`.
     - Missing: `Payment Channel` column and `Settlement Status` column.
     - Hardcoded strings observed: Line 505 `<th className="p-4 text-end">Action</th>`, Line 534 `Mark Dispatched ✓`, Line 537 `Completed`, Line 858 `Merchant Ledger Transactions`.
   - `src/components/AdminPortal.tsx`: Lines 231–255 display `overview.totalGrossSales` (GMV) and `overview.totalPlatformRevenue` (5% Fee).
     - Lines 404–445 render platform orders audit table without displaying `Payment Channel` or `Settlement Status`.
   - `src/components/BuyerOrdersModal.tsx`: Line 166 hardcodes `Gateway Ref: ...` in English.

---

## 2. Logic Chain

1. **From Observation 1 & 2 to Payment Selection Architecture**:
   - Because `CartSlideOver.tsx` is the sole entry point for order placement in the application, adding a modern Payment Method Selector (with radio cards for COD, Fawry, InstaPay/Mobile Wallets, and PayPal) in `CartSlideOver.tsx` directly satisfies Requirement R1 and acceptance criteria.
   - Because COD requires zero upfront digital payment and creates an order in `Pending` state, selecting COD bypasses digital capture and produces a receipt displaying delivery cash preparation instructions.
   - Because Fawry requires an 8-digit bill reference and expiry notice, selecting Fawry generates an 8-digit reference (e.g. `98234710`), displays kiosk instructions (Service Code 788), and provides an instant "Simulate Fawry Settlement" button to transition the order to `Paid`.
   - Because InstaPay / Mobile Wallets requires customer sender details, selecting this channel reveals inputs for sender phone/wallet address and transaction sequence reference before submitting the order into processing (`AwaitingPayment` or `Pending`).

2. **From Observation 3 to Bilingual RTL/LTR Coherence**:
   - Because `LanguageContext.tsx` and `translations.ts` already provide the foundation, adding a dedicated `checkout` section to `Translations` with complete Arabic and English terminology eliminates hardcoded strings.
   - Because numeric reference codes (8-digit Fawry codes, phone numbers, transaction IDs) must not be reversed in Arabic RTL mode, applying `dir="ltr"` and `font-mono` ensures correct bidirectional layout rendering.

3. **From Observation 4 to Dashboard & Portal Consistency**:
   - Because merchants need visibility into how customer orders will be settled (COD cash on delivery vs Fawry at kiosk vs InstaPay vs PayPal), adding `Payment Channel` and `Settlement Status` columns to `MerchantDashboard.tsx` fulfills Acceptance Criterion 37.
   - Because administrators need auditability across all transacted payment methods, adding the channel column to `AdminPortal.tsx` and ensuring GMV / 5% fee counters encompass all channels fulfills Acceptance Criterion 38.

---

## 3. Caveats

- **Network Gateway Mode**: External production Fawry and InstaPay APIs require merchant enterprise credentials. In accordance with the project integrity mode (`demo`), the frontend must gracefully handle both live backend endpoints and realistic local simulation (generating valid 8-digit bill references and realistic status transitions).
- **Backend Sync**: The frontend survey defines contracts (`paymentMethod`, `paymentDetails`, `settlementStatus`) that should align with the backend implementation team.

---

## 4. Conclusion

The frontend architecture is exceptionally clean and well-structured, requiring targeted enhancements across 6 key files:
1. `src/types.ts`: Define `PaymentChannel` and `SettlementStatus`.
2. `src/i18n/translations.ts`: Add comprehensive English and Arabic checkout, payment channel, instruction, and settlement strings.
3. `src/services/api.ts`: Extend `CreateOrderRequest`, `OrderDto`, and `AdminOrderDto` with payment channel and settlement properties, plus settlement API method.
4. `src/components/CartSlideOver.tsx`: Implement the 4-channel payment selector, conditional wallet inputs, and rich channel-specific receipts (with Fawry 8-digit code copy and simulation button).
5. `src/components/MerchantDashboard.tsx`: Add Payment Channel and Settlement Status columns to orders table; replace hardcoded English strings.
6. `src/components/AdminPortal.tsx`: Add Payment Channel to the orders audit table, verify GMV / 5% take-rate metric counters across all channels, and replace hardcoded strings.

A detailed implementation blueprint with complete UI mockups and code contracts has been documented in `d:\AI Software Company\.agents\teamwork\explorer_survey_frontend\survey_report.md`.

---

## 5. Verification Method

1. **Typecheck & Frontend Build**:
   ```powershell
   cd "d:\AI Software Company\products\social-commerce-hub\src\frontend"
   npm run build
   ```
   *Expected outcome*: Exits with code 0 (`tsc -b && vite build` completes with 0 errors).

2. **Backend Test Suite Non-Regression**:
   ```powershell
   dotnet test "d:\AI Software Company\products\social-commerce-hub\src\backend\SocialCommerce.Tests\SocialCommerce.Tests.csproj"
   ```
   *Expected outcome*: Exits with code 0 (all 52 tests pass).

3. **UI / Functional Verification Checklist**:
   - [ ] Open Cart Slide-over: Verify all 4 payment options (Cash on Delivery, Fawry Pay, InstaPay / Mobile Wallets, PayPal) are selectable.
   - [ ] Select Cash on Delivery: Verify zero upfront payment, order created in `Pending` state, COD receipt displayed.
   - [ ] Select Fawry Pay: Verify 8-digit reference code generated, copy button works, instructions displayed, and "Simulate Fawry Settlement" moves order to `Paid`.
   - [ ] Select InstaPay: Verify sender mobile/IPA and transaction reference fields are validated and recorded.
   - [ ] Language Toggle: Switch to Arabic (العربية). Verify RTL direction, 'Cairo' font, LTR preservation for numbers/codes, and natural Egyptian Arabic translations.
   - [ ] Merchant Dashboard: Verify newly placed orders display their payment channel and settlement status.
   - [ ] Admin Portal: Verify GMV and 5% fee counters update across all payment channels.

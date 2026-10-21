# Frontend Architecture & UI Survey Report: Local Egyptian Payment Gateways & Bilingual Checkout

**Product Workspace**: `d:\AI Software Company\products\social-commerce-hub`  
**Explorer Archetype**: Frontend Survey Explorer (`explorer_survey_frontend`)  
**Date**: 2026-10-21  

---

## 1. Executive Summary

Social-Commerce-Hub is a curated multi-store Egyptian e-commerce marketplace built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and **TypeScript ~6.0**. The application features:
- Buyer marketplace discovery with ranked search, video reels, and responsive storefronts.
- Multi-tenant Merchant Command Center with sales KPIs, product catalog management, and order fulfillment.
- Platform Administration Command Center with GMV and 5% platform fee governance.
- A built-in bilingual i18n system (`LanguageContext.tsx` and `translations.ts`) supporting seamless Arabic (RTL with Google Font 'Cairo') and English (LTR with 'Plus Jakarta Sans').

Currently, the checkout flow (`src/components/CartSlideOver.tsx`) only implements PayPal Express Checkout simulation. This survey maps out the comprehensive frontend architecture required to introduce Egyptian local payment channels:
1. **Cash on Delivery (COD / الدفع عند الاستلام)**: Zero upfront digital payment, order created in `Pending` state, cash collection instructions.
2. **Fawry Pay (فوري باي)**: Generates simulated 8-digit bill reference code (e.g. `98234710`) with expiry date, kiosk/app instructions, and instant simulated settlement.
3. **InstaPay / Mobile Wallets (إنستاباي والمحافظ الإلكترونية: فودافون كاش / أورنج / اتصالات / وي)**: Dedicated sender wallet/phone input and transaction reference entry, transitioning order to processing.
4. **Existing PayPal Express**: Preserved and integrated into unified payment selector.
5. **Full Bilingual (RTL/LTR) Support**: Elimination of all hardcoded strings, specialized input formatting (phone numbers, reference codes in LTR), and localized receipt templates.
6. **Merchant Dashboard & Admin Portal Updates**: Real-time payment channel badges, settlement status indicators, and verified GMV/Platform Fee revenue counters across all payment methods.

---

## 2. Existing Frontend Codebase Map

| File Path | Role & Current Functionality | Planned Modifications |
|---|---|---|
| `src/types.ts` | Shared domain interfaces (`Product`, `Merchant`, `CartItem`) | Add `PaymentMethod`, `SettlementStatus`, and order payment metadata types |
| `src/services/api.ts` | API client with typed endpoints and DTO definitions | Update `CreateOrderRequest`, `OrderDto`, `AdminOrderDto`; add payment capture/settle endpoints |
| `src/i18n/translations.ts` | Translation dictionary for `'en'` and `'ar'` | Add comprehensive keys for payment methods, instructions, validation, receipts, and portal tables |
| `src/i18n/LanguageContext.tsx` | RTL/LTR context, direction toggles, currency/date formatters | Already supports `formatCurrency`, `formatNumber`, `formatDate`; no structural changes needed |
| `src/components/CartSlideOver.tsx` | Slide-over drawer handling cart items, customer details, and checkout | Add Payment Method Selector, conditional inputs (wallet number, reference), dynamic receipts |
| `src/components/MerchantDashboard.tsx`| Merchant Command Center: sales metrics, catalog, orders table | Add `Payment Channel` & `Settlement Status` columns to orders table; replace hardcoded strings |
| `src/components/AdminPortal.tsx` | Platform administration: GMV, 5% fee revenue, store & order audits | Add `Payment Channel` column to orders audit table; audit GMV calculation; replace hardcoded strings |
| `src/components/BuyerOrdersModal.tsx` | Buyer order history and verified review prompts | Display payment method badge, Fawry reference / InstaPay sender info, localized statuses |
| `src/index.css` | Global styling, `@import "tailwindcss"`, Cairo / Plus Jakarta Sans fonts | Existing RTL rules are solid; add specific styling helpers for payment pill indicators |

---

## 3. Checkout Flow & Payment Selection Architecture

### 3.1 Payment Method Definitions & Lifecycle

```typescript
export type PaymentMethod = 'CashOnDelivery' | 'Fawry' | 'InstaPay' | 'PayPal';

export type SettlementStatus = 
  | 'PendingPayment'       // Fawry bill generated, waiting customer at kiosk
  | 'PendingCollection'    // COD order placed, cash to be collected on delivery
  | 'PendingVerification'  // InstaPay transfer reported, awaiting confirmation
  | 'Settled';             // Payment verified / captured (PayPal, Settled Fawry/InstaPay/COD)
```

### 3.2 Visual Component Layout (`CartSlideOver.tsx`)

Inside `CartSlideOver.tsx`, underneath the customer delivery details form, we introduce the **Payment Selection Section**:

```
+-------------------------------------------------------------+
| 🛍️ Your Shopping Cart                                   [✕] |
+-------------------------------------------------------------+
| [ Cart Items list with +/- quantities and delete ]          |
+-------------------------------------------------------------+
| 📍 Delivery Information                                     |
| [ Full Name input                           ]               |
| [ Email Address input (dir="ltr")           ]               |
| [ Shipping Address input                    ]               |
+-------------------------------------------------------------+
| 💳 Payment Method / طريقة الدفع                             |
|                                                             |
| (•) 💵 Cash on Delivery (الدفع عند الاستلام)                 |
|     "Pay in cash upon delivery. Zero upfront payment."      |
|                                                             |
| ( ) 🟡 Fawry Pay (فوري باي)                                 |
|     "Pay via 8-digit bill reference at any Fawry kiosk/app" |
|                                                             |
| ( ) ⚡ InstaPay & Mobile Wallets (إنستاباي والمحافظ)        |
|     "Direct instant bank/wallet transfer"                   |
|     +-----------------------------------------------------+ |
|     | Recipient: socialhub@instapay | 0100 123 4567       | |
|     | Sender Mobile / IPA: [ 01012345678            ]     | |
|     | Transfer Ref / Seq:  [ TXN-948201             ]     | |
|     +-----------------------------------------------------+ |
|                                                             |
| ( ) 💳 PayPal Express (بايبال)                              |
|     "Instant digital payment via PayPal Sandbox"            |
+-------------------------------------------------------------+
| Order Summary:                                              |
| Subtotal:                 1,250 EGP                         |
| Shipping:                 FREE                              |
| Total Amount:             1,250 EGP                         |
| (Merchant Net: 1,187.50 EGP | Platform Fee 5%: 62.50 EGP)   |
+-------------------------------------------------------------+
| [ Submit Button: "Place Order (COD) / Generate Fawry Code" ]|
+-------------------------------------------------------------+
```

### 3.3 Dynamic Order Confirmation & Receipt Views

Once an order is created, `CartSlideOver` switches to the Order Confirmation view. This view renders uniquely for each channel:

#### A. Cash on Delivery (COD) Receipt
- **Banner**: Emerald badge `✓ Order Confirmed (Cash on Delivery)` / `تم تأكيد طلبك (الدفع عند الاستلام)`
- **Order ID**: Monospace `#ORD-XXXXXX`
- **Total Payable on Delivery**: e.g. `1,250 ج.م`
- **Customer Note**: "Please ensure you have the exact amount in cash ready for the courier upon delivery."
- **Financial Details**: Subtotal, 5% Platform Fee (`62.50 ج.م`), Merchant Net (`1,187.50 ج.م`), Delivery Address.
- **Settlement Status Badge**: `Pending Collection` / `بانتظار التحصيل عند الاستلام`.

#### B. Fawry Pay Receipt
- **Banner**: Amber badge `🧾 Awaiting Fawry Payment` / `بانتظار السداد عبر فوري`
- **Prominent 8-digit Bill Reference Card**:
  ```
  +--------------------------------------------------------+
  | Fawry Bill Reference Code / كود الدفع فوري             |
  |               >> 7 8 2 1 9 4 0 3 <<                    |
  | [ 📋 Copy Code ]   Valid for: 48 Hours (ينتهي خلال 48 س)|
  +--------------------------------------------------------+
  ```
- **Step-by-step Instructions** (Bilingual):
  1. Visit any Fawry POS retailer, Aman store, or open the myFawry mobile app.
  2. Select payment service: **SocialHub Marketplace (Code: 788)**.
  3. Enter your 8-digit bill reference: `78219403`.
  4. Pay the exact amount: `1,250 EGP`.
- **Simulated Settlement Action**:
  A dedicated button `⚡ Simulate Fawry Kiosk Payment / تجربة سداد فوري تجريبياً` that invokes `api.captureOrder` or a simulated webhook callback, immediately marking the order as `Paid` & `Settled` without leaving the page.

#### C. InstaPay / Mobile Wallets Receipt
- **Banner**: Indigo/Purple badge `⚡ Transfer Recorded - In Processing` / `تم تسجيل التحويل - قيد المراجعة والتجهيز`
- **Order ID**: `#ORD-XXXXXX`
- **Sender Account**: e.g. `01012345678` or `layla@instapay`
- **Transaction Reference**: `TXN-849102`
- **Recipient Verification Account**: `socialhub@instapay` / `0100 123 4567`
- **Settlement Status Badge**: `Awaiting Verification` / `جاري التحقق من التحويل`.

#### D. PayPal Receipt
- **Banner**: Emerald badge `✓ Payment Approved via PayPal` / `تمت الموافقة على الدفع عبر PayPal`
- **PayPal Transaction Ref**: e.g. `PAYID-XXXXXX`
- **Settlement Status Badge**: `Paid & Settled` / `مدفوع ومُسوّى بالكامل`.

---

## 4. Bilingual Experience & RTL/LTR Strategy

### 4.1 Directionality and Font System

1. **Font Hierarchy**:
   - English (LTR): `Plus Jakarta Sans`, system-ui, sans-serif
   - Arabic (RTL): `Cairo`, 'Segoe UI', Tahoma, sans-serif
   - Monospace (all languages): `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
2. **Numbers & Technical Tokens**:
   - Currency display via `formatCurrency(val)`: produces `1,250 ج.م` in Arabic and `1,250 EGP` in English.
   - Reference codes (Fawry 8-digit, Order ID GUIDs, InstaPay transaction IDs) and phone inputs must enforce `dir="ltr"` and `font-mono text-center sm:text-start` so digits are never flipped or reversed in RTL context.
3. **Tailwind Logical Classes**:
   - Use `start-` and `end-` instead of `left-` and `right-`.
   - Use `ps-` and `pe-` instead of `pl-` and `pr-`.
   - Use `ms-` and `me-` instead of `ml-` and `mr-`.
   - Use `border-s` and `border-e` instead of `border-l` and `border-r`.
   - Use `text-start` and `text-end` instead of `text-left` and `text-right`.

### 4.2 Comprehensive Translation Schema Additions (`src/i18n/translations.ts`)

The following translation keys are required in `Translations` interface and both `en` and `ar` dictionaries:

```typescript
// New section: translations.ts -> Translations['checkout']
checkout: {
  selectPaymentMethod: string;
  paymentMethodDesc: string;
  codTitle: string;
  codDesc: string;
  fawryTitle: string;
  fawryDesc: string;
  instaPayTitle: string;
  instaPayDesc: string;
  paypalTitle: string;
  paypalDesc: string;
  
  // Fawry details
  fawryRefCode: string;
  fawryExpiryNotice: string;
  fawryInstructionsTitle: string;
  fawryStep1: string;
  fawryStep2: string;
  fawryStep3: string;
  fawryCopyCode: string;
  fawryCodeCopied: string;
  fawrySimulatePayment: string;
  fawrySettledSuccess: string;
  
  // InstaPay & Wallets
  walletProvider: string;
  senderPhoneLabel: string;
  senderPhonePlaceholder: string;
  transferRefLabel: string;
  transferRefPlaceholder: string;
  recipientAccountNotice: string;
  walletValidationPhone: string;
  walletValidationRef: string;
  
  // COD details
  codInstruction: string;
  codZeroUpfrontBadge: string;
  
  // Receipt & Statuses
  orderIdLabel: string;
  orderDateLabel: string;
  shippingAddressPlaceholder: string;
  statusPending: string;
  statusAwaitingPayment: string;
  statusPaid: string;
  statusFulfilled: string;
  settlementStatusLabel: string;
  settled: string;
  pendingCollection: string;
  pendingVerification: string;
  channelCol: string;
  settlementCol: string;
}
```

### 4.3 Arabic and English Translation Content

#### English (`en`):
```typescript
checkout: {
  selectPaymentMethod: 'Select Payment Method',
  paymentMethodDesc: 'Choose how you would like to complete your order in Egypt.',
  codTitle: 'Cash on Delivery (COD)',
  codDesc: 'Pay in cash upon delivery with zero upfront digital payment.',
  fawryTitle: 'Fawry Pay Reference',
  fawryDesc: 'Pay via 8-digit bill reference at any Fawry retail machine or myFawry app.',
  instaPayTitle: 'InstaPay & Mobile Wallets',
  instaPayDesc: 'Instant transfer via InstaPay (IPA) or Vodafone/Orange/Etisalat Cash.',
  paypalTitle: 'PayPal Sandbox',
  paypalDesc: 'International credit/debit card checkout via encrypted PayPal session.',
  
  fawryRefCode: 'Fawry Bill Reference Code',
  fawryExpiryNotice: 'Valid for 48 hours. Service Code: 788 (SocialHub Egypt)',
  fawryInstructionsTitle: 'How to Pay with Fawry:',
  fawryStep1: 'Visit any Fawry POS store, Aman kiosk, or open the myFawry app.',
  fawryStep2: 'Select SocialHub Marketplace (Service Code: 788).',
  fawryStep3: 'Enter your 8-digit bill reference number and pay in cash.',
  fawryCopyCode: 'Copy Reference',
  fawryCodeCopied: 'Copied!',
  fawrySimulatePayment: '⚡ Simulate Fawry Kiosk Settlement',
  fawrySettledSuccess: 'Fawry bill settled successfully! Order marked as Paid.',
  
  walletProvider: 'Wallet / Transfer Service',
  senderPhoneLabel: 'Sender Phone Number or InstaPay Address',
  senderPhonePlaceholder: 'e.g. 01012345678 or user@instapay',
  transferRefLabel: 'Transaction Reference / Sequence No.',
  transferRefPlaceholder: 'e.g. TXN-849201 or 12-digit receipt reference',
  recipientAccountNotice: 'Transfer total amount to: socialhub@instapay or Wallet 0100 123 4567',
  walletValidationPhone: 'Please enter your sender mobile number or InstaPay address.',
  walletValidationRef: 'Please enter your transfer transaction reference number.',
  
  codInstruction: 'Order confirmed! Please prepare the exact cash amount for the courier upon delivery.',
  codZeroUpfrontBadge: 'Zero Upfront Payment Required',
  
  orderIdLabel: 'Order ID',
  orderDateLabel: 'Order Placed',
  shippingAddressPlaceholder: 'Shipping Address (City, District, Street, Building)',
  statusPending: 'Pending Fulfillment',
  statusAwaitingPayment: 'Awaiting Payment',
  statusPaid: 'Paid & Processing',
  statusFulfilled: 'Fulfilled & Delivered',
  settlementStatusLabel: 'Settlement Status',
  settled: 'Settled',
  pendingCollection: 'Pending Collection on Delivery',
  pendingVerification: 'Pending Transfer Verification',
  channelCol: 'Payment Channel',
  settlementCol: 'Settlement Status',
}
```

#### Arabic (`ar`):
```typescript
checkout: {
  selectPaymentMethod: 'طريقة الدفع',
  paymentMethodDesc: 'اختر طريقة الدفع المناسبة لك لإتمام طلبك داخل مصر.',
  codTitle: 'الدفع نقداً عند الاستلام (COD)',
  codDesc: 'ادفع نقداً لمندوب الشحن عند وصول الطلب بدون أي دفع مسبق.',
  fawryTitle: 'فوري باي (كود سداد فوري)',
  fawryDesc: 'ادفع عبر كود سداد مكون من 8 أرقام في أي ماكينة فوري أو تطبيق myFawry.',
  instaPayTitle: 'إنستاباي ومحافظ المحمول',
  instaPayDesc: 'تحويل فوري عبر تطبيق إنستاباي أو محافظ فودافون/أورنج/اتصالات كاش.',
  paypalTitle: 'بايبال (PayPal)',
  paypalDesc: 'دفع رقمي آمن ومشفر عبر البطاقات البنكية الدولية.',
  
  fawryRefCode: 'كود سداد فوري (رقم الفاتورة)',
  fawryExpiryNotice: 'الكود صالح لمدة 48 ساعة. كود الخدمة: 788 (سوشيال هَب مصر)',
  fawryInstructionsTitle: 'خطوات السداد عبر فوري:',
  fawryStep1: 'توجه إلى أقرب منفذ فوري أو أمان أو افتح تطبيق myFawry.',
  fawryStep2: 'اختر مدفوعات تجارة إلكترونية: منصة سوشيال هَب (كود الخدمة 788).',
  fawryStep3: 'أدخل رقم كود السداد المكون من 8 أرقام وادفع المبلغ المطلوب نقداً.',
  fawryCopyCode: 'نسخ الكود',
  fawryCodeCopied: 'تم النسخ!',
  fawrySimulatePayment: '⚡ محاكاة سداد فوري تجريبياً',
  fawrySettledSuccess: 'تم سداد فاتورة فوري بنجاح! تم تحويل حالة الطلب إلى مدفوع.',
  
  walletProvider: 'جهة التحويل / المحفظة',
  senderPhoneLabel: 'رقم محفظة الراسل أو عنوان إنستاباي',
  senderPhonePlaceholder: 'مثال: 01012345678 أو name@instapay',
  transferRefLabel: 'رقم مرجع العملية / كود التحويل',
  transferRefPlaceholder: 'مثال: TXN-849201 أو الرقم المرجعي للإشعار',
  recipientAccountNotice: 'يرجى تحويل إجمالي المبلغ إلى: socialhub@instapay أو محفظة 01001234567',
  walletValidationPhone: 'يرجى إدخال رقم هاتف الراسل أو عنوان إنستاباي.',
  walletValidationRef: 'يرجى إدخال الرقم المرجعي للتحويل.',
  
  codInstruction: 'تم تأكيد طلبك بنجاح! يرجى تجهيز المبلغ المطلوب نقداً لتسليمه للمندوب عند الاستلام.',
  codZeroUpfrontBadge: 'لا يتطلب دفعاً إلكترونياً مسبقاً',
  
  orderIdLabel: 'رقم الطلب',
  orderDateLabel: 'تاريخ الطلب',
  shippingAddressPlaceholder: 'عنوان التوصيل (المحافظة، المدينة، الشارع، رقم العقار)',
  statusPending: 'قيد التنفيذ والتجهيز',
  statusAwaitingPayment: 'بانتظار السداد',
  statusPaid: 'مدفوع وجاري التجهيز',
  statusFulfilled: 'تم التنفيذ والتسليم',
  settlementStatusLabel: 'حالة التسوية المالية',
  settled: 'مُسوّى بالكامل',
  pendingCollection: 'بانتظار التحصيل عند الاستلام',
  pendingVerification: 'بانتظار تأكيد التحويل',
  channelCol: 'قناة الدفع',
  settlementCol: 'حالة التسوية',
}
```

### 4.4 Hardcoded String Audit & Remediation Table

| File | Line | Current Hardcoded String | Remediation Translation Key |
|---|---|---|---|
| `CartSlideOver.tsx` | 258 | `placeholder="Shipping Address (City, Street)"` | `t.checkout.shippingAddressPlaceholder` |
| `CartSlideOver.tsx` | 144 | `Order ID: #{orderConfirmation.id}` | `t.checkout.orderIdLabel}: #{orderConfirmation.id}` |
| `CartSlideOver.tsx` | 68, 84, 96 | `'Paid (PayPal Sandbox Verified)'` | Localized status from `t.checkout.statusPaid` |
| `CartSlideOver.tsx` | 297 | `💳 {t.cart.checkoutPaypal} ({formatCurrency(totalAmount)})` | Dynamic button text per selected payment channel |
| `BuyerOrdersModal.tsx` | 166 | `Gateway Ref: {order.paymentOrderId...}` | `t.checkout.channelCol}: {order.paymentMethod}` |
| `MerchantDashboard.tsx` | 505 | `<th className="p-4 text-end">Action</th>` | `t.common.actions` |
| `MerchantDashboard.tsx` | 534 | `Mark Dispatched ✓` | `t.merchantDashboard.markDispatched` |
| `MerchantDashboard.tsx` | 537 | `Completed` | `t.merchantDashboard.completed` |
| `MerchantDashboard.tsx` | 858-861 | `Merchant Ledger Transactions`, `Audited settlement...` | Add to `t.merchantDashboard` |
| `AdminPortal.tsx` | 336 | `<th className="py-3 px-4 text-end">Action</th>` | `t.common.actions` |
| `AdminPortal.tsx` | 358 | `'Active' : 'Suspended'` | `t.common.active` / `t.common.suspended` |

---

## 5. Merchant Dashboard & Admin Portal Integration

### 5.1 Merchant Dashboard (`src/components/MerchantDashboard.tsx`)

#### A. Order Table Structure
The orders table in `MerchantDashboard.tsx` currently has 7 columns:
`OrderId`, `Customer`, `Items`, `Total`, `Net Payout`, `Status`, `Action`.

We update it to an 8-column layout including **Payment Channel** and **Settlement Status**:

```
+------------+------------------+------------------+----------+------------+--------------------+---------------------+---------------+
| Order ID   | Customer         | Items            | Total    | Net (95%)  | Channel            | Settlement          | Status        |
+------------+------------------+------------------+----------+------------+--------------------+---------------------+---------------+
| #ORD-849201| Layla Nour       | Kimono (x1)      | 850 EGP  | 807.50 EGP | 🟡 Fawry Pay       | ✓ Settled           | Paid          |
| #ORD-849202| Karim Zaki       | Leather Bag (x1) | 1,250 EGP| 1,187.50EGP| 💵 Cash on Delivery| ⏳ Pending Collect.  | Pending       |
| #ORD-849203| Sarah Mansour    | Silk Scarf (x2)  | 640 EGP  | 608.00 EGP | ⚡ InstaPay Wallet | ⏳ In Verification  | Pending       |
| #ORD-849204| Omar Farid       | Ceramic Mug (x2) | 420 EGP  | 399.00 EGP | 💳 PayPal          | ✓ Settled           | Paid          |
+------------+------------------+------------------+----------+------------+--------------------+---------------------+---------------+
```

#### B. Channel Badges:
- **Cash on Delivery**:
  `<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">💵 Cash on Delivery</span>`
- **Fawry Pay**:
  `<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">🟡 Fawry Pay</span>`
- **InstaPay / Mobile Wallet**:
  `<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">⚡ InstaPay / Wallet</span>`
- **PayPal**:
  `<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">💳 PayPal</span>`

#### C. Settlement Status Badges:
- **Settled**:
  `<span className="text-emerald-400 font-bold">✓ Settled</span>`
- **Pending Collection (COD)**:
  `<span className="text-amber-400 font-bold">⏳ On Delivery</span>`
- **Pending Verification (InstaPay)**:
  `<span className="text-purple-400 font-bold">⏳ In Verification</span>`
- **Awaiting Payment (Fawry)**:
  `<span className="text-yellow-400 font-bold">⏳ At Kiosk</span>`

#### D. Financial Accuracy:
Every order calculates:
- Platform Fee = `Math.round(totalAmount * 0.05 * 100) / 100` (5%)
- Merchant Net = `totalAmount - platformFee` (95%)
- The KPI metric cards at the top of the dashboard reflect all fulfilled and paid orders across every channel.

---

### 5.2 Admin Portal (`src/components/AdminPortal.tsx`)

#### A. KPI Metric Counters:
1. **Platform GMV (`t.adminPortal.gmvMetric`)**:
   - Represents the aggregate gross sales across all settled/active orders from **all payment channels** (COD, Fawry, InstaPay, PayPal).
   - In `overview.totalGrossSales`.
2. **Platform Fee Revenue (`t.adminPortal.feeMetric`)**:
   - Accurately computes `5%` platform commission on transacted volume across all channels.
   - In `overview.totalPlatformRevenue`.
3. **Merchant Disbursements**:
   - Displays the remaining `95%` net merchant payout across all channels.
   - In `overview.totalMerchantDisbursements`.

#### B. Platform Orders Audit Tab:
The `AdminOrderDto` and the table in `AdminPortal.tsx` tab `orders` is upgraded with:
- `Payment Channel` badge (COD, Fawry, InstaPay, PayPal).
- `Settlement Status` indicator.
- Order Gross Amount, Platform Fee (5%), Merchant Net (95%).
- Filter pill allowing the administrator to filter transactions by payment channel (`All`, `COD`, `Fawry`, `InstaPay`, `PayPal`).

---

## 6. Data Contracts & API Client Specifications

### 6.1 `src/types.ts` Additions

```typescript
export type PaymentChannel = 'CashOnDelivery' | 'Fawry' | 'InstaPay' | 'PayPal';

export type SettlementStatus = 'Settled' | 'PendingCollection' | 'PendingVerification' | 'AwaitingPayment';

export interface PaymentDetails {
  channel: PaymentChannel;
  fawryReferenceNumber?: string;
  fawryExpiryDate?: string;
  senderMobileOrWallet?: string;
  senderReferenceNumber?: string;
  settlementStatus: SettlementStatus;
}
```

### 6.2 `src/services/api.ts` DTO Updates

```typescript
export interface CreateOrderRequest {
  merchantId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  paymentMethod: 'CashOnDelivery' | 'Fawry' | 'InstaPay' | 'PayPal';
  paymentDetails?: {
    senderMobileOrWallet?: string;
    senderReferenceNumber?: string;
  };
  items: { productId: string; quantity: number }[];
}

export interface OrderDto {
  id: string;
  merchantId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  platformFeeAmount: number;
  merchantNetAmount: number;
  status: string;
  paymentMethod?: 'CashOnDelivery' | 'Fawry' | 'InstaPay' | 'PayPal';
  paymentOrderId?: string;
  paymentTransactionId?: string;
  fawryReferenceNumber?: string;
  fawryExpiryDate?: string;
  senderMobileOrWallet?: string;
  senderReferenceNumber?: string;
  settlementStatus?: 'Settled' | 'PendingCollection' | 'PendingVerification' | 'AwaitingPayment';
  createdAt: string;
  items: OrderItemDto[];
}

export interface AdminOrderDto {
  id: string;
  merchantId: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  platformFeeAmount: number;
  merchantNetAmount: number;
  status: string;
  paymentMethod?: 'CashOnDelivery' | 'Fawry' | 'InstaPay' | 'PayPal';
  fawryReferenceNumber?: string;
  senderMobileOrWallet?: string;
  settlementStatus?: string;
  createdAtUtc: string;
}
```

### 6.3 Settle / Capture Endpoint Extensions in `api.ts`

```typescript
// Settle / verify order payment (used by Fawry simulated kiosk payment, COD collection, and InstaPay admin confirmation)
async settleOrderPayment(orderId: string, data: { channel: string; reference?: string }): Promise<OrderDto> {
  return request<OrderDto>(`/orders/${orderId}/settle`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

---

## 7. Concrete File Modification Plan

### Step 1: Update Domain Types & Translations (`types.ts` & `translations.ts`)
- **`src/types.ts`**: Add `PaymentChannel` and `SettlementStatus` types.
- **`src/i18n/translations.ts`**:
  - Add `checkout` interface to `Translations`.
  - Add English translations for `checkout`.
  - Add Arabic translations for `checkout`.
  - Add missing table column keys (`channelCol`, `settlementCol`, `markDispatched`, `completed`).

### Step 2: Update API Layer (`src/services/api.ts`)
- Update `CreateOrderRequest` to accept `paymentMethod` and optional `paymentDetails`.
- Update `OrderDto` and `AdminOrderDto` to include `paymentMethod`, `fawryReferenceNumber`, `fawryExpiryDate`, `senderMobileOrWallet`, `senderReferenceNumber`, `settlementStatus`.
- Add `settleOrderPayment(orderId, data)` method.
- Update local sandbox simulation in `CartSlideOver.tsx` to generate simulated 8-digit Fawry reference code (e.g., `Math.floor(10000000 + Math.random() * 90000000).toString()`) and realistic order states when operating in standalone/demo mode.

### Step 3: Upgrade `src/components/CartSlideOver.tsx`
- Introduce state for `selectedPaymentMethod` (defaulting to `'CashOnDelivery'`).
- Add state for `senderWallet` and `transferReference` for InstaPay/Mobile Wallets.
- Add payment method selector cards with clean icons, localized titles, and descriptions.
- Add conditional form inputs for InstaPay / Mobile Wallets with validation.
- Implement checkout submission logic dispatching the selected channel to `api.createOrder`.
- Implement rich, channel-specific order confirmation receipts:
  - COD: Cash instructions, delivery address, reminder.
  - Fawry: 8-digit reference display with copy button, 48h countdown notice, step-by-step instructions, and simulated settlement button.
  - InstaPay: Sender wallet, reference number, recipient notice.
  - PayPal: Preserved express checkout receipt.

### Step 4: Upgrade `src/components/MerchantDashboard.tsx`
- Add `Payment Channel` and `Settlement Status` columns to the orders table header and body.
- Render channel badges (💵 COD, 🟡 Fawry, ⚡ InstaPay, 💳 PayPal).
- Render settlement status badges (`Settled`, `Pending Collection`, `In Verification`, `Awaiting Payment`).
- Replace hardcoded English strings with `t.*` translation keys.

### Step 5: Upgrade `src/components/AdminPortal.tsx`
- Add `Payment Channel` and `Settlement Status` columns to the platform orders audit table.
- Verify GMV and platform fee revenue counter rendering across all channels.
- Replace hardcoded strings in table headers and action buttons.

### Step 6: Upgrade `src/components/BuyerOrdersModal.tsx`
- Display payment channel badge on each past order card.
- Show Fawry bill reference or InstaPay sender reference where applicable.
- Replace hardcoded "Gateway Ref:" with localized labels.

---

## 8. Verification & Test Plan

1. **Typecheck & Build Verification**:
   - Command: `npm run build` in `src/frontend`
   - Target: `tsc -b && vite build` completes with 0 errors and 0 warnings.
2. **Backend Non-Regression**:
   - Command: `dotnet test "src/backend/SocialCommerce.Tests/SocialCommerce.Tests.csproj"`
   - Target: 52/52 existing tests pass with 0 failures.
3. **End-to-End User Experience Scenarios**:
   - **Scenario 1: Cash on Delivery**:
     1. Add item to cart, open slide-over.
     2. Select "Cash on Delivery", enter customer details, submit.
     3. Verify receipt shows COD confirmation, zero upfront payment, total due upon delivery.
     4. Verify order appears in Merchant Dashboard with `Cash on Delivery` channel and `Pending Collection` settlement status.
   - **Scenario 2: Fawry Pay**:
     1. Select "Fawry Pay", submit.
     2. Verify receipt generates simulated 8-digit code (e.g. `98234710`) with copy button and kiosk instructions.
     3. Click "Simulate Fawry Settlement". Verify order moves to `Paid` / `Settled`.
     4. Verify order appears in Merchant Dashboard and Admin Portal with updated GMV and 5% fee.
   - **Scenario 3: InstaPay / Mobile Wallets**:
     1. Select "InstaPay & Mobile Wallets", enter sender wallet `01012345678` and reference `TXN-778899`.
     2. Submit order. Verify receipt displays recorded sender reference.
     3. Verify order appears in Merchant Dashboard with `InstaPay / Wallet` channel and `In Verification` settlement status.
   - **Scenario 4: Bilingual RTL/LTR Switching**:
     1. Toggle language to Arabic (العربية).
     2. Verify layout flips to RTL, font is 'Cairo', text is right-aligned.
     3. Verify Fawry 8-digit reference and phone numbers retain LTR formatting.
     4. Verify all payment selector cards, instructions, receipts, and table headers are translated into natural Egyptian Arabic.
     5. Toggle back to English (LTR). Verify alignment and layout flip back smoothly.

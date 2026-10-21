# Original User Request

## 2026-10-21T11:47:10Z

Implement comprehensive local Egyptian payment gateways and checkout mechanisms for Social-Commerce-Hub, supporting Cash on Delivery (COD), Fawry reference billing, and InstaPay / Mobile Wallets alongside existing PayPal checkout, including automatic 5% platform fee deduction and merchant ledger updates.

Working directory: d:\AI Software Company\products\social-commerce-hub
Integrity mode: demo

## Requirements

### R1. Multi-Channel Egyptian Payment Engine
Provide unified checkout endpoints and UI selections for Egyptian payment channels: Cash on Delivery (COD), Fawry Pay (with simulated 8-digit bill reference and expiry), and InstaPay / Mobile Wallets (Vodafone Cash/Etisalat/Orange) with payment transaction reference entry.

### R2. Order Processing & Financial Ledger
Each payment method must transition orders accurately through states (`Pending`, `Paid`, or `AwaitingPayment`), compute the 5% platform fee, credit 95% net to merchant disbursements, and make orders trackable in both Buyer and Merchant portals.

### R3. Bilingual Checkout Experience (Arabic & English)
All checkout dialogs, instructions (e.g. how to pay with Fawry code or transfer via InstaPay), error validations, and receipt confirmations must render seamlessly in both Arabic (RTL) and English (LTR).

## Verification Resources

- Existing Backend Test Suite: `dotnet test "src/backend/SocialCommerce.Tests/SocialCommerce.Tests.csproj"`
- Frontend Typecheck & Build: `cd src/frontend && npm run build`
- API Contracts & Endpoints: `POST /api/orders` and `POST /api/orders/{id}/capture`

## Acceptance Criteria

### Payment Methods & Checkout
- [ ] Cart slide-over allows selecting Cash on Delivery, Fawry Pay, Mobile Wallets/InstaPay, or PayPal.
- [ ] Selecting Cash on Delivery creates an order in `Pending` state with zero upfront digital payment requirement.
- [ ] Selecting Fawry generates an 8-digit reference code with customer instructions and simulated settlement.
- [ ] Selecting InstaPay / Mobile Wallet allows recording customer sender wallet/reference and moves order to processing.

### Financial Accuracy & Portals
- [ ] Platform fee (5%) and merchant net amount (95%) are accurately calculated for each order regardless of payment method.
- [ ] Merchant Dashboard reflects newly created orders with their specific payment method and settlement status.
- [ ] Admin Portal GMV and platform fee revenue counters update to reflect orders across all payment channels.

### Quality & Non-Regression
- [ ] All existing 52 backend tests continue to pass with 0 failures, plus new tests covering Egyptian payment paths.
- [ ] `npm run build` succeeds with 0 TypeScript and build errors.
- [ ] Full bilingual support (Arabic RTL and English LTR) with no hardcoded strings.

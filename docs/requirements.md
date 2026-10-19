# MVP Product Requirements Document (PRD) — Social-Interactive Commerce Platform

**Product Codename:** `Social-Commerce-Hub`  
**Target Milestone:** MVP Release (Phase 2 Foundation)  
**Status:** DRAFT — Updated with Approved Payment & Frontend Architecture  

---

## 1. Executive Summary & Objective

`Social-Commerce-Hub` is a modern multi-store e-commerce platform designed to solve the two biggest problems faced by emerging independent brands and merchants:
1. **The Storefront Problem:** Needing an elegant, mobile-first, independent online store without complex setup.
2. **The Discovery Problem:** Eliminating the "isolated island" problem of traditional e-commerce by providing an **interactive visual home feed** (short video & image cards) where new products are instantly discovered by shoppers.

---

## 2. Target Users & Personas

- **Merchant Persona (Sari - The Boutique Creator):** Runs an independent fashion/accessories brand. Currently relies on Instagram DMs and manual bank transfers. Wants an automated, professional store that generates organic views.
- **Shopper Persona (Youssef - The Visual Buyer):** Browses social feeds for trendy, quality local products. Values quick video previews, clear prices, genuine reviews, and seamless, secure digital checkout.

---

## 3. Core MVP Feature Scope

### Feature 1: Multi-Tenant Merchant Management
- Merchant registration, profile setup, and customizable branding.
- Dedicated store URL route: `/store/{merchant-slug}`.
- Product Catalog CRUD: Title, description, price, inventory quantity, media attachments.

### Feature 2: Interactive Discovery Home Feed
- Central `/` landing feed featuring algorithmic or chronological product discovery cards.
- **Card Elements:**
  - Fast-loading visual gallery (optimized images & short video clips).
  - Merchant badge (logo + store name) linking to store page.
  - Price display & discount tags.
  - Verified customer star rating.
  - Quick action: **`Buy Now`** opening frictionless checkout drawer.
- Virtualized infinite scrolling optimized for mobile web (React / TypeScript).

### Feature 3: Digital Checkout & Decoupled Payments (`IPaymentProvider`)
- **Primary Payment Provider:** **PayPal Checkout** integration (Customer cards and PayPal balances).
- **Payment Architecture:** Pluggable `IPaymentProvider` contract to allow swapping or adding alternative providers (e.g., Paymob, Stripe) without redesigning core order logic.
- **Settlement & Payout Model:** Centralized collection into the platform account during checkout, with automated internal balance crediting (`MerchantLedger`). Manual/scheduled periodic disbursements to merchant bank accounts (no assumption of automated real-time split payments in early MVP).
- Webhook processing with strict idempotency and event audit logs.

### Feature 4: Verified Review & Rating Engine
- Reviews can only be submitted by verified purchasers with order status `Delivered`.
- Average star rating computed asynchronously and cached on the product entity.

---

## 4. Technical Architecture Baseline

### Backend Architecture (.NET 10 / ASP.NET Core)
- **Framework:** ASP.NET Core (.NET 10 LTS baseline).
- **Architecture Pattern:** Clean Modular Monolith (Vertical Slice / Domain-Driven structure).
- **Database:** PostgreSQL (with EF Core + `AsNoTracking` for read pipelines).
- **Payment Abstraction:** `IPaymentProvider` & `PaymentProviderFactory` interface.
- **Caching & High-Throughput Feed:** In-Memory Cache with Redis readiness.
- **Media Storage:** Cloudflare R2 / S3-compatible bucket via pre-signed URLs.

### Frontend Architecture (React / TypeScript)
- **Framework:** React with TypeScript (SPA / Next.js client model).
- **Mobile-First UX:** Tailored for seamless smartphone browsing with touch gestures.
- **Feed Virtualization:** DOM virtualization for the infinite product feed to guarantee high-framerate scrolling (60fps) without memory bloat.
- **State & Data Fetching:** Lightweight state management with optimized client-side caching (TanStack Query / Zustand).
- **Checkout Component:** Clean, isolated PayPal JS SDK integration inside an accessible modal/drawer.

---

## 5. Explicit Non-Goals for Initial MVP

- No complex multi-level MLM or viral referral schemes in initial release (deferred to Phase 2.1).
- No physical Cash-on-Delivery (COD) reconciliation in initial release (digital payment first).
- No automated real-time split payout routing (disbursements handled on ledger schedule).
- No cross-merchant mixed shopping cart (shoppers checkout one store at a time).
- No custom domain mapping (CNAME) initially; rely on platform sub-paths.

---

## 6. MVP Success Criteria

1. A merchant can register and publish a product with media in under 3 minutes.
2. The product appears instantly on the interactive home feed.
3. A shopper can view the feed on mobile, click `Buy Now`, complete payment via PayPal sandbox test flow, and receive an instant order confirmation.
4. Merchant ledger records the verified sale amount minus platform fee ready for disbursement.

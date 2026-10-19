# ADR-0001 — Selection of Core Product: Social-Interactive Multi-Store Commerce Platform

## Metadata

| Field                 | Value                                                              |
|-----------------------|--------------------------------------------------------------------|
| **ADR ID**            | ADR-0001                                                           |
| **Date**              | 2026-10-20                                                         |
| **Status**            | APPROVED                                                           |
| **Decision Level**    | Level 3 — Advanced (Strategic Product & Architecture Selection)    |
| **Product**           | Social-Commerce-Hub (Platform Core)                                |
| **Affected Modules**  | Platform Architecture, Merchant Storefronts, Feed Engine, Checkout |
| **Approval Required** | Yes                                                                |
| **Approval ID**       | APR-0005                                                           |

## Context and Problem

During Phase 0 and Phase 1, initial candidate SaaS ideas (COD Return Shield, ETA Tax Bridge, Developer DLQ Hub) were evaluated. The company owner rejected those directions due to heavy local market saturation, operational friction, and narrow compliance focus.

The owner and the Product Discovery Council convened an interactive strategy session to identify a differentiated software product that:
1. Gives merchants independent, high-converting digital storefronts.
2. Solves the discovery/traffic bottleneck without forcing merchants to spend heavily on paid ads.
3. Uses modern digital payments to eliminate cash-on-delivery (COD) collection risk.
4. Provides a solid backend foundation for the owner (.NET 10 / ASP.NET Core developer) alongside a modern React frontend.

## Constraints and Requirements

- **Merchant Independence:** Each merchant must have a dedicated store identity, URL slug, and product catalog.
- **Organic Discovery:** An interactive, media-rich central home feed displaying new products with price, ratings, and instant purchase.
- **Pluggable Digital Payments:** Centralized checkout with PayPal as the initial preferred provider, abstracted via an `IPaymentProvider` interface to support alternative gateways (e.g., Paymob, Stripe) without redesign.
- **Frontend Performance:** React with TypeScript, using list virtualization to handle infinite visual feeds at 60fps on mobile.
- **Scalable Architecture:** Clean Modular Monolith in ASP.NET Core with PostgreSQL, optimized for low baseline operational costs.
- **Phased Growth:** Advanced loyalty networks, AI product studio tools, and subscription tiers will be added as progressive enhancements.

## Alternatives Considered

### Option A — Isolated White-Label Storefronts (Pure SaaS / Shopify-like)
- **Benefits:** Simpler logistics; pure software subscription model.
- **Drawbacks:** Recreates the "isolated desert" problem where merchants struggle to generate traffic on their own.

### Option B — Fully Centralized Megamarket (Amazon / Noon model)
- **Benefits:** Maximum shared traffic.
- **Drawbacks:** Erases individual merchant branding; introduces massive logistics and mixed-cart shipping headaches for an early-stage startup.

### Option C (Chosen) — Social-Interactive Multi-Store Platform with Unified Discovery Feed
- **Description:** Independent merchant storefronts combined with a dynamic, media-rich home feed (TikTok/Instagram Shop style), decoupled digital payments, and a React mobile-first interface.
- **Benefits:** Merchants gain both a standalone shop and an instant discovery channel; decoupled payments prevent vendor lock-in; highly engaging user experience.
- **Drawbacks:** Requires careful media optimization and async background tasks for image/video handling.

## Decision

Adopt **Option C: Social-Interactive Multi-Store Commerce Platform** as the company's primary product.

Core MVP Capabilities:
1. **Merchant Portal:** Quick store setup, product catalog management, media uploads, and pricing.
2. **Dedicated Storefronts:** Branded, mobile-responsive store pages (`/store/{merchant-slug}`).
3. **Interactive Home Feed:** Algorithmic/chronological stream of short videos and product cards with store badge, pricing, verified reviews, and a 1-click `Buy Now` trigger.
4. **Decoupled Payment Gateway (`IPaymentProvider`):** Initial implementation using **PayPal Checkout**, collecting payments centrally with ledger-based periodic disbursements to merchants (no reliance on automated real-time split payouts in early MVP).
5. **Modern React Frontend:** High-performance React SPA/client leveraging DOM virtualization for feed smoothness.
6. **Verified Review System:** Only customers with confirmed, delivered orders can post ratings and reviews.

## Benefits and Trade-offs

- **Benefits:** Clear merchant value proposition ("storefront + free discovery feed"); decoupled payment architecture allows seamless provider additions; clean domain boundaries in .NET and React.
- **Trade-offs:** Payouts require scheduled manual/semi-automated reconciliation rather than real-time automated gateway splits.

## Risks and Mitigations

- **Media Bandwidth Costs:** Mitigated by utilizing cost-effective object storage with zero-egress fees (Cloudflare R2) and compressing media asynchronously.
- **Payment Gateway Eligibility & Restrictions:** Abstracted behind `IPaymentProvider` so that if PayPal account onboarding or local withdrawal faces friction, Paymob or another provider can be slotted in with zero disruption to domain models.
- **Mobile Feed Memory Usage:** Mitigated by using React list virtualization to unmount off-screen media.

## Conditions for Revisiting

- Merchant acquisition feedback indicates mandatory requirement for local Cash-on-Delivery alongside digital cards.
- Introduction of an officially supported local automated split-payout provider in Egypt (e.g. Paymob Marketplace API maturity) justifying an architectural upgrade to real-time disbursements.

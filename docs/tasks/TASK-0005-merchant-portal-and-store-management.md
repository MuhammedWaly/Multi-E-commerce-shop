# TASK-0005 — Merchant Portal & Store Management Engine

## Metadata

| Field                | Value                                                              |
|----------------------|--------------------------------------------------------------------|
| **Task ID**          | TASK-0005                                                          |
| **Title**            | Merchant Portal & Store Management Engine                          |
| **Product**          | products/social-commerce-hub                                       |
| **Phase**            | Phase 2 — Multi-Store Operations & Seller Ecosystem                |
| **Status**           | COMPLETED                                                          |
| **Priority**         | High                                                               |
| **Estimated Effort** | Medium                                                             |
| **Assigned To**      | Full Engineering Team (under Owner direction)                      |
| **Created**          | 2026-10-20                                                         |
| **Updated**          | 2026-10-20                                                         |

## Context

Following the successful launch and commit of the Web Marketplace and core checkout engine (`203fa9c`), merchants require a dedicated portal to manage their independent stores. This includes reviewing real-time earnings, tracking incoming customer orders, updating fulfillment states, and publishing new products directly to their storefront and the central marketplace.

## Scope

1. **Backend (.NET 10 API & Application):**
   - Implemented `MerchantDashboardDto` aggregate and queries.
   - Endpoints:
     - `GET /api/merchants/{id}/dashboard`: Metrics (Balance, Gross Sales, Net Earnings, Order counts).
     - `GET /api/merchants/{id}/orders`: List of orders placed for this specific merchant.
     - `PATCH /api/orders/{id}/status`: Transition order status (e.g., mark as `Fulfilled`).
   - Unit test coverage for merchant dashboard analytics and order status updates (20/20 passing).

2. **Frontend (React 19 Web App):**
   - Built `MerchantDashboard.tsx` with KPI overview cards, live incoming orders management table, and product publisher form.
   - Added portal switch in global navbar allowing instant toggle between Shopper Marketplace and Merchant Portal.
   - Tested and verified clean build.

## Acceptance Criteria

1. [x] All .NET unit tests pass (20/20 green).
2. [x] Merchant dashboard endpoint computes correct net balance, platform fees, and order lists.
3. [x] Order fulfillment transition enforces domain invariants (only paid orders can be fulfilled).
4. [x] React frontend allows switching to Merchant Portal, viewing orders, and publishing products.
5. [x] Frontend builds cleanly with 0 TypeScript/Vite errors.
6. [x] `STATE.md` updated and remains <= 50 lines.

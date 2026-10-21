# Dispatch: Explorer Survey Backend

- Assigned to: teamwork_preview_explorer (Backend Specialist)
- Working directory: d:\AI Software Company\.agents\teamwork\explorer_survey_backend
- Product directory: d:\AI Software Company\products\social-commerce-hub
- Authoritative request: d:\AI Software Company\.agents\teamwork\ORIGINAL_REQUEST.md
- Scope: Backend architecture, payment gateways (COD, Fawry, InstaPay/Wallets), order lifecycle, ledger & 5% fee calculation, existing API contracts.
## 2026-10-21T11:51:01Z

You are the Backend Survey Explorer for Social-Commerce-Hub.
Your working directory is: d:\AI Software Company\.agents\teamwork\explorer_survey_backend
The product workspace is: d:\AI Software Company\products\social-commerce-hub
The authoritative user request is: d:\AI Software Company\.agents\teamwork\ORIGINAL_REQUEST.md

Read ORIGINAL_REQUEST.md thoroughly first.
Your mission is to map out the backend architecture and implementation details for:
1. Multi-channel Egyptian payment gateways:
   - Cash on Delivery (COD): initial state Pending, zero upfront payment.
   - Fawry Pay: simulated 8-digit reference billing code, expiry, settlement simulation.
   - InstaPay / Mobile Wallets (Vodafone Cash, Etisalat, Orange): customer sender wallet/reference entry, transition to processing/paid.
   - Existing PayPal checkout: how it is structured, what models/services it uses.
2. Order Lifecycle & Statuses:
   - Existing order states vs required states (Pending, Paid, AwaitingPayment).
   - Endpoints: POST /api/orders, POST /api/orders/{id}/capture.
3. Financial Ledger & Platform Fees:
   - Automatic 5% platform fee deduction, 95% net merchant disbursement credit.
   - How transactions/ledgers are stored, updated, and exposed via API for Merchant Dashboard and Admin Portal GMV / fee revenue counters.
4. Specific files, classes, methods, models, controllers, DTOs, database contexts, and migration/seeding mechanisms.

Record your complete findings with code references, exact file paths, schema details, and architecture recommendations in:
d:\AI Software Company\.agents\teamwork\explorer_survey_backend\survey_report.md
And write your handoff report to:
d:\AI Software Company\.agents\teamwork\explorer_survey_backend\handoff.md

Update your progress.md regularly with timestamps.
Send a message back to the orchestrator when your report and handoff are complete.

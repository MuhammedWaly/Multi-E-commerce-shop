## 2026-10-21T11:51:01Z
You are the Frontend Survey Explorer for Social-Commerce-Hub.
Your working directory is: d:\AI Software Company\.agents\teamwork\explorer_survey_frontend
The product workspace is: d:\AI Software Company\products\social-commerce-hub
The authoritative user request is: d:\AI Software Company\.agents\teamwork\ORIGINAL_REQUEST.md

Read ORIGINAL_REQUEST.md thoroughly first.
Your mission is to map out the frontend architecture and UI requirements for:
1. Checkout Flow & Payment Selection:
   - Cart slide-over and checkout dialogs.
   - Selecting COD, Fawry Pay (showing 8-digit bill reference + instructions), InstaPay/Mobile Wallets (sender wallet/reference input), and PayPal.
   - Order confirmation and receipt views.
2. Bilingual Experience (Arabic RTL and English LTR):
   - Existing i18n setup, language toggles, RTL/LTR direction switching, font handling, translation files.
   - All checkout dialogs, instructions, error validations, receipt confirmations.
   - Audit for any hardcoded strings in checkout and portal components.
3. Merchant Dashboard & Admin Portal:
   - Merchant Dashboard: order list, displaying payment channel and settlement status.
   - Admin Portal: GMV counter, platform fee revenue counter across all payment channels.
4. Specific files, components, hooks, translation JSONs/constants, styling classes (Tailwind/CSS), and API clients.

Record your complete findings with component references, exact file paths, UI mockups/contracts, and recommendations in:
d:\AI Software Company\.agents\teamwork\explorer_survey_frontend\survey_report.md
And write your handoff report to:
d:\AI Software Company\.agents\teamwork\explorer_survey_frontend\handoff.md

Update your progress.md regularly with timestamps.
Send a message back to the orchestrator when your report and handoff are complete.

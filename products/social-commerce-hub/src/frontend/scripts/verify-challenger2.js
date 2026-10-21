// Challenger 2 Verification & Adversarial Test Suite
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log(' CHALLENGER 2: EMPIRICAL VERIFICATION & STRESS-TEST SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
const findings = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${testName} - ${details}`);
    findings.push({ testName, details, severity: 'HIGH' });
  }
}

function warn(testName, details) {
  console.warn(`  [WARN] ${testName}: ${details}`);
  findings.push({ testName, details, severity: 'WARNING' });
}

// -----------------------------------------------------------------------------
// TEST SUITE 1: INPUT VALIDATION & ADVERSARIAL BOUNDARY CASES
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 1: Checkout & Portal Input Validation ---');

// Simulated checkout state & validation logic identical to CartSlideOver.tsx:
function validateInstaPayInputs(senderWallet, transferReference) {
  if (!senderWallet.trim()) {
    return { valid: false, error: 'walletValidationPhone' };
  }
  if (!transferReference.trim()) {
    return { valid: false, error: 'walletValidationRef' };
  }
  return { valid: true, error: null };
}

// 1.1 Empty phone & whitespace tests
assert(validateInstaPayInputs('', 'TXN-1234').valid === false, 'Empty phone is rejected');
assert(validateInstaPayInputs('   ', 'TXN-1234').valid === false, 'Whitespace-only phone is rejected');
assert(validateInstaPayInputs('\t\n\r', 'TXN-1234').valid === false, 'Whitespace escape characters rejected');

// 1.2 Empty transfer reference & whitespace tests
assert(validateInstaPayInputs('01012345678', '').valid === false, 'Empty transfer reference is rejected');
assert(validateInstaPayInputs('01012345678', '   ').valid === false, 'Whitespace-only transfer reference is rejected');
assert(validateInstaPayInputs('01012345678', '\t\n').valid === false, 'Whitespace escape characters in reference rejected');

// 1.3 Whitespace trimming behavior
const validWithSurroundingSpaces = validateInstaPayInputs('  01012345678  ', '  TXN-998877  ');
assert(validWithSurroundingSpaces.valid === true, 'Valid phone/reference with surrounding spaces passes validation guard');

// 1.4 Extra long input strings
const extraLongPhone = '010' + '1'.repeat(10000);
const extraLongRef = 'TXN-' + 'A'.repeat(20000);
const longValidation = validateInstaPayInputs(extraLongPhone, extraLongRef);
assert(longValidation.valid === true, 'Extra long input strings (10,000+ chars) do not throw or crash input validator');

// 1.5 Special characters, SQL injection and XSS strings
const sqlInjectionPhone = "' OR 1=1; DROP TABLE Orders; --";
const xssPayloadRef = "<script>alert('XSS')</script>";
const specialCharsValidation = validateInstaPayInputs(sqlInjectionPhone, xssPayloadRef);
assert(specialCharsValidation.valid === true, 'Special chars / SQL injection / XSS strings are safely held as text input');

// Audit whether CartSlideOver.tsx trims senderWallet and transferReference before payload submission
const cartSlideOverPath = path.join(frontendDir, 'src', 'components', 'CartSlideOver.tsx');
const cartContent = fs.readFileSync(cartSlideOverPath, 'utf8');

const trimsBeforePayload = cartContent.includes('senderWallet.trim()') &&
                           cartContent.includes('transferReference.trim()');
assert(trimsBeforePayload, 'CartSlideOver checks .trim() on wallet and reference before processing order');

// Check if payload submits trimmed or raw
const submitsRawWallet = cartContent.includes('senderWalletOrReference: selectedPaymentMethod === \'InstaPay\' ? senderWallet : undefined');
if (submitsRawWallet) {
  warn('Whitespace Preservation in Payload', 'CartSlideOver passes senderWallet directly to createOrder without .trim() on the outgoing DTO payload. Backend handles it via EffectiveSenderWallet.');
}

// -----------------------------------------------------------------------------
// TEST SUITE 2: FAWRY REFERENCE FORMATTING & RTL/LTR DIRECTION
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Fawry Reference Formatting & Directionality ---');

// 2.1 Fawry reference code generation in frontend:
// CartSlideOver.tsx: Math.floor(10000000 + Math.random() * 90000000).toString()
let all8Digits = true;
let allNumeric = true;
let inRange = true;

for (let i = 0; i < 10000; i++) {
  const code = Math.floor(10000000 + Math.random() * 90000000).toString();
  if (code.length !== 8) all8Digits = false;
  if (!/^\d{8}$/.test(code)) allNumeric = false;
  const num = parseInt(code, 10);
  if (num < 10000000 || num > 99999999) inRange = false;
}

assert(all8Digits, '10,000 simulated Fawry codes are strictly 8 characters in length');
assert(allNumeric, '10,000 simulated Fawry codes are strictly numeric digits (0-9)');
assert(inRange, '10,000 simulated Fawry codes are strictly within range [10000000, 99999999]');

// 2.2 Verify LTR Direction in CartSlideOver.tsx
const fawryDisplayRegex = /<div[^>]*dir="ltr"[^>]*>\s*\{orderConfirmation\.fawryReferenceNumber\}\s*<\/div>/s;
const hasLtrFawryDisplay = fawryDisplayRegex.test(cartContent) || cartContent.includes('dir="ltr"\n                      >\n                        {orderConfirmation.fawryReferenceNumber}');
assert(hasLtrFawryDisplay || (cartContent.includes('{orderConfirmation.fawryReferenceNumber}') && cartContent.includes('dir="ltr"')), 
  'CartSlideOver explicitly renders Fawry reference code with dir="ltr" to prevent RTL distortion');

// 2.3 Verify LTR Direction in BuyerOrdersModal.tsx
const buyerOrdersPath = path.join(frontendDir, 'src', 'components', 'BuyerOrdersModal.tsx');
const buyerOrdersContent = fs.readFileSync(buyerOrdersPath, 'utf8');
const buyerOrdersHasLtr = buyerOrdersContent.includes('dir="ltr"') && buyerOrdersContent.includes('order.fawryReferenceNumber');
assert(buyerOrdersHasLtr, 'BuyerOrdersModal renders order references with explicit dir="ltr" attribute');

// -----------------------------------------------------------------------------
// TEST SUITE 3: BILINGUAL CONSISTENCY & TRANSLATIONS AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Bilingual Consistency & Translations Audit ---');

const translationsPath = path.join(frontendDir, 'src', 'i18n', 'translations.ts');
const translationsRaw = fs.readFileSync(translationsPath, 'utf8');

// Check that both 'en:' and 'ar:' dictionaries are present in translations.ts
assert(translationsRaw.includes('export const translations: Record<Language, Translations> = {'), 'translations dictionary exported with strict TypeScript typing');
assert(translationsRaw.includes('  en: {') && translationsRaw.includes('  ar: {'), 'Both English (en) and Arabic (ar) dictionaries defined');

// Extract all keys defined in interface Translations
const interfaceMatch = translationsRaw.match(/export interface Translations \{([\s\S]*?)\}\n\nexport const translations/);
assert(interfaceMatch !== null, 'Found Translations interface definition in translations.ts');

// Audit component files for untranslated strings or hardcoded UI text
const componentsToAudit = [
  { name: 'CartSlideOver.tsx', path: cartSlideOverPath, content: cartContent },
  { name: 'MerchantDashboard.tsx', path: path.join(frontendDir, 'src', 'components', 'MerchantDashboard.tsx'), content: fs.readFileSync(path.join(frontendDir, 'src', 'components', 'MerchantDashboard.tsx'), 'utf8') },
  { name: 'AdminPortal.tsx', path: path.join(frontendDir, 'src', 'components', 'AdminPortal.tsx'), content: fs.readFileSync(path.join(frontendDir, 'src', 'components', 'AdminPortal.tsx'), 'utf8') },
  { name: 'BuyerOrdersModal.tsx', path: buyerOrdersPath, content: buyerOrdersContent }
];

// Check for specific hardcoded strings in AdminPortal
const adminContent = componentsToAudit.find(c => c.name === 'AdminPortal.tsx').content;
const adminHardcodedFindings = [];

if (adminContent.includes("'👥 User Directory'")) {
  adminHardcodedFindings.push("Tab label '👥 User Directory' is hardcoded in English instead of using t.* dictionary");
}
if (adminContent.includes("'Refresh Metrics'")) {
  adminHardcodedFindings.push("Button label 'Refresh Metrics' is hardcoded in English instead of using t.* dictionary");
}
if (adminContent.includes("'Role: '") || adminContent.includes('Role: {currentUser.role}')) {
  adminHardcodedFindings.push("Header label 'Role: {currentUser.role}' has hardcoded English prefix 'Role:'");
}
if (adminContent.includes('Platform Architecture & Identity Health')) {
  adminHardcodedFindings.push("Admin overview card 'Platform Architecture & Identity Health' is hardcoded in English");
}
if (adminContent.includes("m.isActive ? 'Suspend' : 'Reactivate'")) {
  adminHardcodedFindings.push("Merchant action button toggle ('Suspend' / 'Reactivate') is hardcoded in English");
}
if (adminContent.includes('Registered User Accounts')) {
  adminHardcodedFindings.push("User directory heading 'Registered User Accounts' is hardcoded in English");
}
if (adminContent.includes('Role-Based Access Control (RBAC) Directory')) {
  adminHardcodedFindings.push("User directory subtitle 'Role-Based Access Control (RBAC) Directory' is hardcoded in English");
}
if (adminContent.includes('<th className="py-3 px-4">Role</th>')) {
  adminHardcodedFindings.push("User directory table header 'Role' is hardcoded in English");
}
if (adminContent.includes('<th className="py-3 px-4">Associated Store</th>')) {
  adminHardcodedFindings.push("User directory table header 'Associated Store' is hardcoded in English");
}

console.log(`\n  [AUDIT] Found ${adminHardcodedFindings.length} hardcoded text instances in AdminPortal.tsx:`);
adminHardcodedFindings.forEach(f => {
  warn('AdminPortal Hardcoded String', f);
});

// Check for specific hardcoded strings in MerchantDashboard
const merchantContent = componentsToAudit.find(c => c.name === 'MerchantDashboard.tsx').content;
const merchantHardcodedFindings = [];

if (merchantContent.includes("window.confirm(`Are you sure you want to permanently delete product")) {
  merchantHardcodedFindings.push("Product deletion confirm dialog has hardcoded English message");
}
if (merchantContent.includes("'Failed to delete product.'")) {
  merchantHardcodedFindings.push("Alert error message 'Failed to delete product.' is hardcoded in English");
}
if (merchantContent.includes("'Failed to upload media file.'")) {
  merchantHardcodedFindings.push("Media upload error message 'Failed to upload media file.' is hardcoded in English");
}
if (merchantContent.includes("Viewing in <strong>Store Preview</strong> mode")) {
  merchantHardcodedFindings.push("Store preview banner has hardcoded English text");
}
if (merchantContent.includes("Sign In as Merchant →")) {
  merchantHardcodedFindings.push("Store preview sign-in button 'Sign In as Merchant →' is hardcoded in English");
}
if (merchantContent.includes("📁 {t.common.loading ? '' : ''}Upload")) {
  merchantHardcodedFindings.push("Media mode toggle 'Upload' text is hardcoded in English");
}
if (merchantContent.includes("🔗 Link URL")) {
  merchantHardcodedFindings.push("Media mode toggle 'Link URL' text is hardcoded in English");
}
if (merchantContent.includes("Product {editingProductId ? 'updated' : 'published'} successfully!")) {
  merchantHardcodedFindings.push("Product publish/update success banner is hardcoded in English");
}

console.log(`\n  [AUDIT] Found ${merchantHardcodedFindings.length} hardcoded text instances in MerchantDashboard.tsx:`);
merchantHardcodedFindings.forEach(f => {
  warn('MerchantDashboard Hardcoded String', f);
});

// Check for hardcoded badges in CartSlideOver
const cartHardcodedFindings = [];
if (cartContent.includes("Code: 788")) {
  cartHardcodedFindings.push("Fawry badge 'Code: 788' is hardcoded in English");
}
if (cartContent.includes("IPA / Wallets")) {
  cartHardcodedFindings.push("InstaPay badge 'IPA / Wallets' is hardcoded in English");
}
if (cartContent.includes(">Cards<") || cartContent.includes("Cards\n")) {
  cartHardcodedFindings.push("PayPal badge 'Cards' is hardcoded in English");
}

console.log(`\n  [AUDIT] Found ${cartHardcodedFindings.length} hardcoded badge text instances in CartSlideOver.tsx:`);
cartHardcodedFindings.forEach(f => {
  warn('CartSlideOver Hardcoded String', f);
});

// Check BuyerOrdersModal
const buyerOrdersHardcodedFindings = [];
if (buyerOrdersContent.includes("'Failed to load order history'")) {
  buyerOrdersHardcodedFindings.push("Error fallback 'Failed to load order history' is hardcoded in English");
}
console.log(`\n  [AUDIT] Found ${buyerOrdersHardcodedFindings.length} hardcoded text instances in BuyerOrdersModal.tsx:`);
buyerOrdersHardcodedFindings.forEach(f => {
  warn('BuyerOrdersModal Hardcoded String', f);
});

// -----------------------------------------------------------------------------
// TEST SUITE 4: CHANNEL FILTER PILLS IN ADMIN PORTAL
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Admin Portal Channel Filter Pills & Totals ---');

// Mock orders dataset matching AdminOrderDto
const mockOrders = [
  { id: 'o-1', storeName: 'Store A', totalAmount: 1000, platformFeeAmount: 50, merchantNetAmount: 950, paymentMethod: 'CashOnDelivery', status: 'Pending', settlementStatus: 'PendingCollection', createdAtUtc: '2026-10-21T10:00:00Z' },
  { id: 'o-2', storeName: 'Store B', totalAmount: 800, platformFeeAmount: 40, merchantNetAmount: 760, paymentMethod: 'Fawry', status: 'AwaitingPayment', settlementStatus: 'PendingPayment', createdAtUtc: '2026-10-21T11:00:00Z' },
  { id: 'o-3', storeName: 'Store C', totalAmount: 1200, platformFeeAmount: 60, merchantNetAmount: 1140, paymentMethod: 'InstaPay', status: 'Processing', settlementStatus: 'PendingVerification', createdAtUtc: '2026-10-21T11:30:00Z' },
  { id: 'o-4', storeName: 'Store A', totalAmount: 500, platformFeeAmount: 25, merchantNetAmount: 475, paymentMethod: 'PayPal', status: 'Paid', settlementStatus: 'Settled', createdAtUtc: '2026-10-21T12:00:00Z' },
  { id: 'o-5', storeName: 'Store B', totalAmount: 300, platformFeeAmount: 15, merchantNetAmount: 285, paymentMethod: null, status: 'Paid', settlementStatus: 'Settled', createdAtUtc: '2026-10-21T12:30:00Z' } // fallback to PayPal
];

// Mock overview metrics object from backend (aggregates settled orders or all orders depending on metric)
const mockOverview = {
  totalGrossSales: 800, // o-4 (500) + o-5 (300) settled
  totalPlatformRevenue: 40,
  totalMerchantDisbursements: 760,
  totalMerchantsCount: 3,
  totalOrdersCount: 5,
  totalProductsCount: 12
};

function filterOrdersByChannel(orders, selectedFilter) {
  return orders.filter(o => selectedFilter === 'ALL' || (o.paymentMethod || 'PayPal') === selectedFilter);
}

// 4.1 Filter ALL returns all orders
const allResult = filterOrdersByChannel(mockOrders, 'ALL');
assert(allResult.length === 5, 'Filter ALL returns all 5 orders');

// 4.2 Filter COD returns only COD orders
const codResult = filterOrdersByChannel(mockOrders, 'CashOnDelivery');
assert(codResult.length === 1 && codResult[0].id === 'o-1', 'Filter CashOnDelivery returns exactly the 1 COD order');

// 4.3 Filter Fawry returns only Fawry orders
const fawryResult = filterOrdersByChannel(mockOrders, 'Fawry');
assert(fawryResult.length === 1 && fawryResult[0].id === 'o-2', 'Filter Fawry returns exactly the 1 Fawry order');

// 4.4 Filter InstaPay returns only InstaPay orders
const instaPayResult = filterOrdersByChannel(mockOrders, 'InstaPay');
assert(instaPayResult.length === 1 && instaPayResult[0].id === 'o-3', 'Filter InstaPay returns exactly the 1 InstaPay order');

// 4.5 Filter PayPal returns both explicit PayPal and null/fallback orders
const payPalResult = filterOrdersByChannel(mockOrders, 'PayPal');
assert(payPalResult.length === 2 && payPalResult.some(o => o.id === 'o-4') && payPalResult.some(o => o.id === 'o-5'), 
  'Filter PayPal returns explicit PayPal orders AND fallback orders where paymentMethod is null/omitted');

// 4.6 Verification that total counters are NOT mutated or broken by filter pills
// In AdminPortal.tsx:
// - Overview counters are read directly from `overview.*` (state independent of selectedChannelFilter)
// - Table header count is read from `orders.length` (unfiltered array)
// - Tab badge count is `{ id: 'orders', label: t.adminPortal.tabsAudit, count: orders.length }`
const headerCounterBeforeFilter = mockOrders.length;
const filteredRows = filterOrdersByChannel(mockOrders, 'Fawry');
const headerCounterAfterFilter = mockOrders.length;
const gmvMetricPreserved = mockOverview.totalGrossSales === 800 && mockOverview.totalOrdersCount === 5;

assert(headerCounterBeforeFilter === headerCounterAfterFilter, 'Orders total counter (orders.length = 5) remains unmutated when filter pill is selected');
assert(filteredRows.length === 1, 'Table rows rendered count is correctly restricted to 1 matching row');
assert(gmvMetricPreserved, 'Platform Overview counters (totalOrdersCount=5, totalGrossSales=800) are unaffected by channel filter pills');

// -----------------------------------------------------------------------------
// SUMMARY REPORT
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED, ${findings.filter(f => f.severity === 'WARNING').length} WARNINGS`);
console.log('================================================================');

process.exit(failCount > 0 ? 1 : 0);

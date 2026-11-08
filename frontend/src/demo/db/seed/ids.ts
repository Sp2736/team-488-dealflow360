/**
 * Deterministic Seeded IDs & Pre-rendered Runtime Pool IDs
 *
 * Used both at build-time (generateStaticParams) and at runtime
 * (store seeding + next-free pool slot allocation).
 */

function pad(num: number, size = 4): string {
  let s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
}

// 120 seeded quotes + 40 runtime pool slots
export const BASE_QUOTE_IDS = Array.from({ length: 120 }, (_, i) => `qte_${pad(i + 1)}`);
export const POOL_QUOTE_IDS = Array.from({ length: 40 }, (_, i) => `qte_new_${pad(i + 1, 2)}`);
export const SEEDED_QUOTE_IDS = [...BASE_QUOTE_IDS, ...POOL_QUOTE_IDS];

// 50 seeded orders + 40 runtime pool slots
export const BASE_ORDER_IDS = Array.from({ length: 50 }, (_, i) => `ord_${pad(i + 1)}`);
export const POOL_ORDER_IDS = Array.from({ length: 40 }, (_, i) => `ord_new_${pad(i + 1, 2)}`);
export const SEEDED_ORDER_IDS = [...BASE_ORDER_IDS, ...POOL_ORDER_IDS];

// 70 seeded invoices + 40 runtime pool slots
export const BASE_INVOICE_IDS = Array.from({ length: 70 }, (_, i) => `inv_${pad(i + 1)}`);
export const POOL_INVOICE_IDS = Array.from({ length: 40 }, (_, i) => `inv_new_${pad(i + 1, 2)}`);
export const SEEDED_INVOICE_IDS = [...BASE_INVOICE_IDS, ...POOL_INVOICE_IDS];

// 60 seeded products + 40 runtime pool slots
export const BASE_PRODUCT_IDS = Array.from({ length: 60 }, (_, i) => `prd_${pad(i + 1)}`);
export const POOL_PRODUCT_IDS = Array.from({ length: 40 }, (_, i) => `prd_new_${pad(i + 1, 2)}`);
export const SEEDED_PRODUCT_IDS = [...BASE_PRODUCT_IDS, ...POOL_PRODUCT_IDS];

// 25 seeded subscriptions + 40 runtime pool slots
export const BASE_SUBSCRIPTION_IDS = Array.from({ length: 25 }, (_, i) => `sub_${pad(i + 1)}`);
export const POOL_SUBSCRIPTION_IDS = Array.from({ length: 40 }, (_, i) => `sub_new_${pad(i + 1, 2)}`);
export const SEEDED_SUBSCRIPTION_IDS = [...BASE_SUBSCRIPTION_IDS, ...POOL_SUBSCRIPTION_IDS];

// 8 seeded customer invites + 20 runtime pool tokens
export const BASE_INVITE_TOKENS = Array.from({ length: 8 }, (_, i) => `invite_${pad(i + 1)}`);
export const POOL_INVITE_TOKENS = Array.from({ length: 20 }, (_, i) => `invite-demo-${pad(i + 1, 2)}`);
export const SEEDED_INVITE_TOKENS = [...BASE_INVITE_TOKENS, ...POOL_INVITE_TOKENS];

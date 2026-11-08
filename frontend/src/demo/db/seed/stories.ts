// src/demo/db/seed/stories.ts
/**
 * Concrete definitions and metadata for the 8 scripted demo stories.
 * Fixed IDs enable the Guided Tour, manual deep linking, and automated audit checks.
 */

export interface ScriptedStory {
  id: number;
  name: string;
  quoteId: string;
  quoteNumber: string;
  customerId: string;
  salesRepId: string;
  title: string;
  summary: string;
  keyEntities: {
    orderId?: string;
    invoiceId?: string;
    subscriptionId?: string;
    negotiationId?: string;
    creditNoteId?: string;
  };
}

export const SCRIPTED_STORIES: ScriptedStory[] = [
  {
    id: 1,
    name: 'Happy path',
    quoteId: 'qte_0001',
    quoteNumber: 'QTE-2025-0001',
    customerId: 'cus_001',
    salesRepId: 'usr_002', // Sarah Jenkins
    title: 'Flawless Enterprise Quotation to Payment',
    summary: 'Standard enterprise hardware order for GOLD customer Acme Global Ltd. Low risk, auto-approved, confirmed to order, fully allocated, invoiced, and paid in full.',
    keyEntities: {
      orderId: 'ord_0001',
      invoiceId: 'inv_0001',
    },
  },
  {
    id: 2,
    name: 'Two-step approval',
    quoteId: 'qte_0002',
    quoteNumber: 'QTE-2025-0002',
    customerId: 'cus_002',
    salesRepId: 'usr_002',
    title: 'High-Discount Escalation Workflow',
    summary: '28% discount requested on server clusters for Northwind Mock Ltd exceeds tier and category ceilings. Risk Engine flags HIGH risk, requiring sequential approval by Sales Manager (approved) and Finance (currently pending).',
    keyEntities: {},
  },
  {
    id: 3,
    name: 'Margin floor breach',
    quoteId: 'qte_0003',
    quoteNumber: 'QTE-2025-0003',
    customerId: 'cus_003',
    salesRepId: 'usr_002',
    title: 'Low-Margin Floor Protection Alert',
    summary: 'Low-cost peripheral bundle with thin margin combined with requested discount breaches the global 15% margin floor. Margin Engine flags negative variance, triggering manager review.',
    keyEntities: {},
  },
  {
    id: 4,
    name: 'Out-of-stock split',
    quoteId: 'qte_0004',
    quoteNumber: 'QTE-2025-0004',
    customerId: 'cus_004',
    salesRepId: 'usr_002',
    title: 'Multi-Warehouse Allocation & Unfulfillable Line',
    summary: 'High quantity laptop line cannot be fulfilled from a single warehouse. Greedily splits between Bengaluru (25 units) and Mumbai (20 units). A second line is completely out of stock, triggering inventory risk score.',
    keyEntities: {
      orderId: 'ord_0004',
    },
  },
  {
    id: 5,
    name: 'Customer counter-offer',
    quoteId: 'qte_0005',
    quoteNumber: 'QTE-2025-0005',
    customerId: 'cus_005',
    salesRepId: 'usr_002',
    title: 'Interactive Customer Portal Negotiation',
    summary: 'Portal user Rachel Green counters a quotation with an 18% discount proposal. Negotiation Engine routes the counter-offer and logs structured negotiation history.',
    keyEntities: {
      negotiationId: 'neg_001',
    },
  },
  {
    id: 6,
    name: 'Revision loop',
    quoteId: 'qte_0006',
    quoteNumber: 'QTE-2025-0006',
    customerId: 'cus_006',
    salesRepId: 'usr_002',
    title: 'Manager Revision Request & Re-drafting',
    summary: 'Sales Manager David Kim requests revision on pricing and terms. Quotation moves back to DRAFT with revision notes, allowing rep to edit and resubmit.',
    keyEntities: {},
  },
  {
    id: 7,
    name: 'Subscription lifecycle',
    quoteId: 'qte_0007',
    quoteNumber: 'QTE-2025-0007',
    customerId: 'cus_007',
    salesRepId: 'usr_002',
    title: 'Recurring SaaS Billing, Mid-Term Cancel & Credit Note',
    summary: 'Annual Cloud VPC subscription confirmed with monthly billing schedule. Mid-term cancellation executes proration engine and automatically generates Credit Note cn_0001.',
    keyEntities: {
      subscriptionId: 'sub_0001',
      creditNoteId: 'cn_0001',
    },
  },
  {
    id: 8,
    name: 'Upsell',
    quoteId: 'qte_0008',
    quoteNumber: 'QTE-2025-0008',
    customerId: 'cus_001',
    salesRepId: 'usr_002',
    title: 'AI/Rule-Based Upsell & Co-Purchase Recommendations',
    summary: 'Draft cart with ApexBook Pro workstation triggers Upsell Engine recommendations (Thunderbolt Dock and 34" Curved Monitor) based on co-purchase frequency and margin gates.',
    keyEntities: {},
  },
];


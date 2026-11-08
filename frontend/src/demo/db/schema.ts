// src/demo/db/schema.ts
/**
 * TypeScript types, enums and metadata mirroring all 33 Prisma models.
 */

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export type UserRole =
  | 'ADMIN'
  | 'SALES_REP'
  | 'SALES_MANAGER'
  | 'FINANCE'
  | 'OPERATIONS'
  | 'CUSTOMER';

export type CustomerTierName = 'BRONZE' | 'SILVER' | 'GOLD';

export type ProductType = 'HARDWARE' | 'SERVICE' | 'SUBSCRIPTION';

export type QuoteStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEGOTIATION'
  | 'CONFIRMED'
  | 'FULFILLING'
  | 'COMPLETED'
  | 'CANCELLED';

export type ApprovalStatus =
  | 'WAITING'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUESTED';

export type ApprovalActionType = 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'FULFILLING'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED';

export type FulfillmentStatus = 'PENDING' | 'ALLOCATED' | 'SHIPPED' | 'DELIVERED';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'UPI' | 'CHEQUE' | 'OTHER';

export type BillingFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type BillingStatus = 'PENDING' | 'BILLED' | 'PAID';

export type CreditNoteReason = string;

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export type DealHealthLevel = 'HEALTHY' | 'WATCH' | 'AT_RISK' | 'CRITICAL';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type AuditAction = string;

// -----------------------------------------------------------------------------
// Model Interfaces (33 Models)
// -----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTier {
  id: string;
  name: string;
  defaultDiscountPercent: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  tierId?: string | null;
  currency: string;
  active: boolean;
  portalUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInvite {
  id: string;
  customerId: string;
  email: string;
  token: string;
  status: InviteStatus;
  invitedById: string;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId?: string | null;
  type: ProductType;
  unit: string;
  basePrice: number;
  costPrice: number;
  taxPercent: number;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  extraPrice: number;
  active: boolean;
  createdAt: string;
}

export interface PriceList {
  id: string;
  name: string;
  currency: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  price: number;
  createdAt: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  customerTierId?: string | null;
  categoryId?: string | null;
  maxDiscountPercent: number;
  priority: number;
  active: boolean;
  createdAt: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  minRiskScore: number;
  maxRiskScore: number;
  requiredRoles: string; // JSON string array of roles e.g. '["SALES_MANAGER","FINANCE"]'
  active: boolean;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  frequency: BillingFrequency;
  price: number;
  prorationEnabled: boolean;
  refundEnabled: boolean;
  active: boolean;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  shippingBaseCost: number;
  active: boolean;
  createdAt: string;
}

export interface Inventory {
  id: string;
  warehouseId: string;
  productId: string;
  quantityAvailable: number;
  quantityReserved: number;
  updatedAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  salesRepId: string;
  status: QuoteStatus;
  subtotal: number;
  discountAmount: number;
  total: number;
  marginAmount?: number | null;
  marginPercent?: number | null;
  riskScore?: number | null;
  riskLevel?: DealHealthLevel | null;
  portalToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLine {
  id: string;
  quoteId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
  marginAmount?: number | null;
  billingType: 'ONE_TIME' | 'RECURRING';
  subscriptionPlanId?: string | null;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  quoteId: string;
  step: number;
  role: string;
  status: ApprovalStatus;
  reviewerId?: string | null;
  reason?: string | null;
  actedAt?: string | null;
  createdAt: string;
}

export interface ApprovalAction {
  id: string;
  approvalRequestId: string;
  actorId: string;
  action: ApprovalActionType;
  reason?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  quoteId: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentAllocation {
  id: string;
  orderId: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  shippingCost: number;
  status?: FulfillmentStatus;
  createdAt: string;
}

export interface Invoice {
  id: string;
  orderId?: string | null;
  invoiceNumber: string;
  type: 'ONE_TIME' | 'RECURRING';
  amount: number;
  status: InvoiceStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string | null;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  amount: number;
  reason?: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  orderId?: string | null;
  quoteLineId?: string | null;
  subscriptionPlanId: string;
  quantity: number;
  status: SubscriptionStatus;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSchedule {
  id: string;
  subscriptionId: string;
  billingDate: string;
  amount: number;
  status: BillingStatus;
  invoiceId?: string | null;
  createdAt: string;
}

export interface Negotiation {
  id: string;
  quoteId: string;
  customerId: string;
  status: 'OPEN' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  proposedDiscount?: number | null;
  message?: string | null;
  createdAt: string;
}

export interface NegotiationMessage {
  id: string;
  negotiationId: string;
  quoteLineId?: string | null;
  authorRole: string;
  message: string;
  createdAt: string;
}

export interface DealHealthEvent {
  id: string;
  quoteId: string;
  score: number;
  level: DealHealthLevel;
  reasons: string; // JSON string
  createdAt: string;
}

export interface Alert {
  id: string;
  quoteId?: string | null;
  type: string;
  severity: AlertSeverity;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface ProductCoPurchase {
  id: string;
  productId: string;
  coProductId: string;
  frequency: number;
}

export interface UpsellRule {
  id: string;
  productId: string;
  suggestedProductId: string;
  promotion: boolean;
  minMarginPercent: number;
  active: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  beforeData?: string | null;
  afterData?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId?: string | null;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Table Name Mapping
// -----------------------------------------------------------------------------

export interface DemoDatabaseSchema {
  User: User[];
  CustomerTier: CustomerTier[];
  Customer: Customer[];
  CustomerInvite: CustomerInvite[];
  ProductCategory: ProductCategory[];
  Product: Product[];
  ProductVariant: ProductVariant[];
  PriceList: PriceList[];
  PriceListItem: PriceListItem[];
  DiscountRule: DiscountRule[];
  ApprovalRule: ApprovalRule[];
  SubscriptionPlan: SubscriptionPlan[];
  Warehouse: Warehouse[];
  Inventory: Inventory[];
  Quote: Quote[];
  QuoteLine: QuoteLine[];
  ApprovalRequest: ApprovalRequest[];
  ApprovalAction: ApprovalAction[];
  Order: Order[];
  FulfillmentAllocation: FulfillmentAllocation[];
  Invoice: Invoice[];
  Payment: Payment[];
  CreditNote: CreditNote[];
  Subscription: Subscription[];
  BillingSchedule: BillingSchedule[];
  Negotiation: Negotiation[];
  NegotiationMessage: NegotiationMessage[];
  DealHealthEvent: DealHealthEvent[];
  Alert: Alert[];
  ProductCoPurchase: ProductCoPurchase[];
  UpsellRule: UpsellRule[];
  AuditLog: AuditLog[];
  Notification: Notification[];
}

export type TableName = keyof DemoDatabaseSchema;

export const TABLE_NAMES: TableName[] = [
  'User',
  'CustomerTier',
  'Customer',
  'CustomerInvite',
  'ProductCategory',
  'Product',
  'ProductVariant',
  'PriceList',
  'PriceListItem',
  'DiscountRule',
  'ApprovalRule',
  'SubscriptionPlan',
  'Warehouse',
  'Inventory',
  'Quote',
  'QuoteLine',
  'ApprovalRequest',
  'ApprovalAction',
  'Order',
  'FulfillmentAllocation',
  'Invoice',
  'Payment',
  'CreditNote',
  'Subscription',
  'BillingSchedule',
  'Negotiation',
  'NegotiationMessage',
  'DealHealthEvent',
  'Alert',
  'ProductCoPurchase',
  'UpsellRule',
  'AuditLog',
  'Notification',
];

// Unique constraint definitions
export const UNIQUE_CONSTRAINTS: Record<TableName, string[][]> = {
  User: [['email']],
  CustomerTier: [['name']],
  Customer: [],
  CustomerInvite: [['token']],
  ProductCategory: [['name']],
  Product: [['sku']],
  ProductVariant: [['sku']],
  PriceList: [],
  PriceListItem: [['priceListId', 'productId']],
  DiscountRule: [],
  ApprovalRule: [],
  SubscriptionPlan: [],
  Warehouse: [['code']],
  Inventory: [['warehouseId', 'productId']],
  Quote: [['quoteNumber']],
  QuoteLine: [],
  ApprovalRequest: [],
  ApprovalAction: [],
  Order: [['orderNumber']],
  FulfillmentAllocation: [],
  Invoice: [['invoiceNumber']],
  Payment: [],
  CreditNote: [],
  Subscription: [],
  BillingSchedule: [],
  Negotiation: [],
  NegotiationMessage: [],
  DealHealthEvent: [],
  Alert: [],
  ProductCoPurchase: [['productId', 'coProductId']],
  UpsellRule: [],
  AuditLog: [],
  Notification: [],
};

// Relations for cascade and SetNull emulation
export interface RelationMeta {
  foreignTable: TableName;
  foreignKey: string;
  onDelete: 'Cascade' | 'SetNull' | 'NoAction';
}

export const RELATIONS_ON_DELETE: Record<TableName, RelationMeta[]> = {
  CustomerTier: [
    { foreignTable: 'Customer', foreignKey: 'tierId', onDelete: 'SetNull' },
    { foreignTable: 'DiscountRule', foreignKey: 'customerTierId', onDelete: 'SetNull' },
  ],
  Customer: [
    { foreignTable: 'CustomerInvite', foreignKey: 'customerId', onDelete: 'Cascade' },
    { foreignTable: 'Quote', foreignKey: 'customerId', onDelete: 'Cascade' },
    { foreignTable: 'Negotiation', foreignKey: 'customerId', onDelete: 'Cascade' },
  ],
  ProductCategory: [
    { foreignTable: 'Product', foreignKey: 'categoryId', onDelete: 'SetNull' },
    { foreignTable: 'DiscountRule', foreignKey: 'categoryId', onDelete: 'SetNull' },
  ],
  Product: [
    { foreignTable: 'ProductVariant', foreignKey: 'productId', onDelete: 'Cascade' },
    { foreignTable: 'PriceListItem', foreignKey: 'productId', onDelete: 'Cascade' },
    { foreignTable: 'Inventory', foreignKey: 'productId', onDelete: 'Cascade' },
    { foreignTable: 'ProductCoPurchase', foreignKey: 'productId', onDelete: 'Cascade' },
    { foreignTable: 'ProductCoPurchase', foreignKey: 'coProductId', onDelete: 'Cascade' },
    { foreignTable: 'UpsellRule', foreignKey: 'productId', onDelete: 'Cascade' },
    { foreignTable: 'UpsellRule', foreignKey: 'suggestedProductId', onDelete: 'Cascade' },
  ],
  PriceList: [
    { foreignTable: 'PriceListItem', foreignKey: 'priceListId', onDelete: 'Cascade' },
  ],
  SubscriptionPlan: [
    { foreignTable: 'QuoteLine', foreignKey: 'subscriptionPlanId', onDelete: 'SetNull' },
  ],
  Warehouse: [
    { foreignTable: 'Inventory', foreignKey: 'warehouseId', onDelete: 'Cascade' },
    { foreignTable: 'FulfillmentAllocation', foreignKey: 'warehouseId', onDelete: 'Cascade' },
  ],
  Quote: [
    { foreignTable: 'QuoteLine', foreignKey: 'quoteId', onDelete: 'Cascade' },
    { foreignTable: 'ApprovalRequest', foreignKey: 'quoteId', onDelete: 'Cascade' },
    { foreignTable: 'Negotiation', foreignKey: 'quoteId', onDelete: 'Cascade' },
    { foreignTable: 'DealHealthEvent', foreignKey: 'quoteId', onDelete: 'Cascade' },
    { foreignTable: 'Alert', foreignKey: 'quoteId', onDelete: 'Cascade' },
  ],
  ApprovalRequest: [
    { foreignTable: 'ApprovalAction', foreignKey: 'approvalRequestId', onDelete: 'Cascade' },
  ],
  Order: [
    { foreignTable: 'FulfillmentAllocation', foreignKey: 'orderId', onDelete: 'Cascade' },
    { foreignTable: 'Invoice', foreignKey: 'orderId', onDelete: 'SetNull' },
    { foreignTable: 'Subscription', foreignKey: 'orderId', onDelete: 'SetNull' },
  ],
  Invoice: [
    { foreignTable: 'Payment', foreignKey: 'invoiceId', onDelete: 'Cascade' },
    { foreignTable: 'CreditNote', foreignKey: 'invoiceId', onDelete: 'Cascade' },
  ],
  Subscription: [
    { foreignTable: 'BillingSchedule', foreignKey: 'subscriptionId', onDelete: 'Cascade' },
    { foreignTable: 'CreditNote', foreignKey: 'subscriptionId', onDelete: 'SetNull' },
  ],
  Negotiation: [
    { foreignTable: 'NegotiationMessage', foreignKey: 'negotiationId', onDelete: 'Cascade' },
  ],
  User: [
    { foreignTable: 'AuditLog', foreignKey: 'actorId', onDelete: 'SetNull' },
    { foreignTable: 'Notification', foreignKey: 'recipientId', onDelete: 'SetNull' },
  ],
  CustomerInvite: [],
  ProductVariant: [],
  PriceListItem: [],
  DiscountRule: [],
  ApprovalRule: [],
  Inventory: [],
  QuoteLine: [],
  ApprovalAction: [],
  FulfillmentAllocation: [],
  Payment: [],
  CreditNote: [],
  BillingSchedule: [],
  NegotiationMessage: [],
  DealHealthEvent: [],
  Alert: [],
  ProductCoPurchase: [],
  UpsellRule: [],
  AuditLog: [],
  Notification: [],
};


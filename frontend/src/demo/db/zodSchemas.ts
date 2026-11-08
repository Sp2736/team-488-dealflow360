// src/demo/db/zodSchemas.ts
/**
 * Zod validation schemas for all 33 tables in the DealFlow360 demo database.
 * Used during store hydration, self-checks, and testing.
 */

import { z } from 'zod';
import type { TableName } from './schema';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string().optional(),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'CUSTOMER']),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CustomerTierSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  defaultDiscountPercent: z.number().min(0).max(100),
  createdAt: z.string(),
});

export const CustomerSchema = z.object({
  id: z.string(),
  companyName: z.string().min(1),
  contactName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  tierId: z.string().nullable().optional(),
  currency: z.string().default('INR'),
  active: z.boolean(),
  portalUserId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CustomerInviteSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  email: z.string().email(),
  token: z.string().min(1),
  status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']),
  invitedById: z.string(),
  expiresAt: z.string(),
  acceptedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const ProductCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  createdAt: z.string(),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  type: z.enum(['HARDWARE', 'SERVICE', 'SUBSCRIPTION']),
  unit: z.string(),
  basePrice: z.number().min(0),
  costPrice: z.number().min(0),
  taxPercent: z.number().min(0).max(100),
  description: z.string().nullable().optional(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProductVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string().min(1),
  name: z.string().min(1),
  extraPrice: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
});

export const PriceListSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  currency: z.string().default('INR'),
  description: z.string().nullable().optional(),
  active: z.boolean(),
  createdAt: z.string(),
});

export const PriceListItemSchema = z.object({
  id: z.string(),
  priceListId: z.string(),
  productId: z.string(),
  price: z.number().min(0),
  createdAt: z.string(),
});

export const DiscountRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  customerTierId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  maxDiscountPercent: z.number().min(0).max(100),
  priority: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
});

export const ApprovalRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  minRiskScore: z.number(),
  maxRiskScore: z.number(),
  requiredRoles: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
});

export const SubscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  price: z.number().min(0),
  prorationEnabled: z.boolean(),
  refundEnabled: z.boolean(),
  active: z.boolean(),
  createdAt: z.string(),
});

export const WarehouseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  code: z.string().min(1),
  location: z.string().nullable().optional(),
  shippingBaseCost: z.number().min(0),
  active: z.boolean(),
  createdAt: z.string(),
});

export const InventorySchema = z.object({
  id: z.string(),
  warehouseId: z.string(),
  productId: z.string(),
  quantityAvailable: z.number().min(0),
  quantityReserved: z.number().min(0).default(0),
  updatedAt: z.string(),
});

export const QuoteSchema = z.object({
  id: z.string(),
  quoteNumber: z.string().min(1),
  customerId: z.string(),
  salesRepId: z.string(),
  status: z.enum([
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'NEGOTIATION',
    'CONFIRMED',
    'FULFILLING',
    'COMPLETED',
    'CANCELLED',
  ]),
  subtotal: z.number().min(0),
  discountAmount: z.number().min(0),
  total: z.number().min(0),
  marginAmount: z.number().nullable().optional(),
  marginPercent: z.number().nullable().optional(),
  riskScore: z.number().nullable().optional(),
  riskLevel: z.enum(['HEALTHY', 'WATCH', 'AT_RISK', 'CRITICAL']).nullable().optional(),
  portalToken: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const QuoteLineSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  productId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100),
  discountAmount: z.number().min(0),
  lineTotal: z.number().min(0),
  marginAmount: z.number().nullable().optional(),
  billingType: z.enum(['ONE_TIME', 'RECURRING']),
  subscriptionPlanId: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const ApprovalRequestSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  step: z.number().positive(),
  role: z.string(),
  status: z.enum(['WAITING', 'PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED']),
  reviewerId: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  actedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const ApprovalActionSchema = z.object({
  id: z.string(),
  approvalRequestId: z.string(),
  actorId: z.string(),
  action: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUESTED']),
  reason: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const OrderSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  orderNumber: z.string().min(1),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'FULFILLING',
    'PARTIALLY_FULFILLED',
    'FULFILLED',
    'CANCELLED',
  ]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const FulfillmentAllocationSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  warehouseId: z.string(),
  productId: z.string(),
  quantity: z.number().min(0),
  shippingCost: z.number().min(0),
  status: z.enum(['PENDING', 'ALLOCATED', 'SHIPPED', 'DELIVERED']).optional(),
  createdAt: z.string(),
});

export const InvoiceSchema = z.object({
  id: z.string(),
  orderId: z.string().nullable().optional(),
  invoiceNumber: z.string().min(1),
  type: z.enum(['ONE_TIME', 'RECURRING']),
  amount: z.number().min(0),
  status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'CANCELLED']),
  dueDate: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PaymentSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  amount: z.number().min(0),
  method: z.string(),
  reference: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const CreditNoteSchema = z.object({
  id: z.string(),
  invoiceId: z.string().nullable().optional(),
  subscriptionId: z.string().nullable().optional(),
  amount: z.number().min(0),
  reason: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const SubscriptionSchema = z.object({
  id: z.string(),
  orderId: z.string().nullable().optional(),
  quoteLineId: z.string().nullable().optional(),
  subscriptionPlanId: z.string(),
  quantity: z.number().positive(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED', 'PAUSED']),
  startedAt: z.string(),
  endedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const BillingScheduleSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  billingDate: z.string(),
  amount: z.number().min(0),
  status: z.enum(['PENDING', 'BILLED', 'PAID']),
  invoiceId: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const NegotiationSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  customerId: z.string(),
  status: z.enum(['OPEN', 'SUBMITTED', 'ACCEPTED', 'REJECTED']),
  proposedDiscount: z.number().nullable().optional(),
  message: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const NegotiationMessageSchema = z.object({
  id: z.string(),
  negotiationId: z.string(),
  quoteLineId: z.string().nullable().optional(),
  authorRole: z.string(),
  message: z.string(),
  createdAt: z.string(),
});

export const DealHealthEventSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  score: z.number(),
  level: z.enum(['HEALTHY', 'WATCH', 'AT_RISK', 'CRITICAL']),
  reasons: z.string(),
  createdAt: z.string(),
});

export const AlertSchema = z.object({
  id: z.string(),
  quoteId: z.string().nullable().optional(),
  type: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  message: z.string(),
  acknowledged: z.boolean(),
  createdAt: z.string(),
});

export const ProductCoPurchaseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  coProductId: z.string(),
  frequency: z.number().min(0),
});

export const UpsellRuleSchema = z.object({
  id: z.string(),
  productId: z.string(),
  suggestedProductId: z.string(),
  promotion: z.boolean(),
  minMarginPercent: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
});

export const AuditLogSchema = z.object({
  id: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  action: z.string(),
  actorId: z.string().nullable().optional(),
  beforeData: z.string().nullable().optional(),
  afterData: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const NotificationSchema = z.object({
  id: z.string(),
  recipientId: z.string().nullable().optional(),
  type: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

export const TABLE_SCHEMAS: Record<TableName, z.ZodObject<any>> = {
  User: UserSchema,
  CustomerTier: CustomerTierSchema,
  Customer: CustomerSchema,
  CustomerInvite: CustomerInviteSchema,
  ProductCategory: ProductCategorySchema,
  Product: ProductSchema,
  ProductVariant: ProductVariantSchema,
  PriceList: PriceListSchema,
  PriceListItem: PriceListItemSchema,
  DiscountRule: DiscountRuleSchema,
  ApprovalRule: ApprovalRuleSchema,
  SubscriptionPlan: SubscriptionPlanSchema,
  Warehouse: WarehouseSchema,
  Inventory: InventorySchema,
  Quote: QuoteSchema,
  QuoteLine: QuoteLineSchema,
  ApprovalRequest: ApprovalRequestSchema,
  ApprovalAction: ApprovalActionSchema,
  Order: OrderSchema,
  FulfillmentAllocation: FulfillmentAllocationSchema,
  Invoice: InvoiceSchema,
  Payment: PaymentSchema,
  CreditNote: CreditNoteSchema,
  Subscription: SubscriptionSchema,
  BillingSchedule: BillingScheduleSchema,
  Negotiation: NegotiationSchema,
  NegotiationMessage: NegotiationMessageSchema,
  DealHealthEvent: DealHealthEventSchema,
  Alert: AlertSchema,
  ProductCoPurchase: ProductCoPurchaseSchema,
  UpsellRule: UpsellRuleSchema,
  AuditLog: AuditLogSchema,
  Notification: NotificationSchema,
};

export function validateTableRows(table: TableName, rows: unknown[]): { valid: boolean; errors?: string[] } {
  const schema = TABLE_SCHEMAS[table];
  if (!schema) {
    return { valid: false, errors: [`Unknown table schema: ${table}`] };
  }

  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const result = schema.safeParse(rows[i]);
    if (!result.success) {
      errors.push(`Row ${i} in ${table} failed validation: ${result.error.message}`);
      if (errors.length > 5) break; // early limit
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}


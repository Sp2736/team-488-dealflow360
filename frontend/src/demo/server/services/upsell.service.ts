// src/demo/server/services/upsell.service.ts
/**
 * Upsell Service — browser-side port over store.ts
 * Evaluates co-purchase candidates and active promotion rules via Upsell Engine.
 */

import { getStore } from '@/demo/db/store';
import { ApiError } from '../errors';
import { runUpsellEngine } from '@/lib/engines/upsell.engine';
import type {
  Quote,
  QuoteLine,
  Product,
  ProductCoPurchase,
  UpsellRule,
  ProductCategory,
} from '@/demo/db/schema';

export async function getUpsellSuggestions(quoteId: string) {
  const store = getStore();

  const quote = store.get<Quote>('Quote', quoteId);
  if (!quote) throw ApiError.notFound('Quote not found');

  const quoteLines = store.where<QuoteLine>('QuoteLine', l => l.quoteId === quoteId);
  const existingProductIds = quoteLines.map(l => l.productId);

  // Co-purchase candidates
  const coPurchases = store.where<ProductCoPurchase>(
    'ProductCoPurchase',
    cp => existingProductIds.includes(cp.productId)
  );

  // Active upsell rules
  const upsellRules = store.where<UpsellRule>(
    'UpsellRule',
    r => r.active && existingProductIds.includes(r.productId)
  );

  const promotionSet = new Set(upsellRules.filter(r => r.promotion).map(r => r.suggestedProductId));

  const candidateMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      categoryName: string;
      coPurchaseFrequency: number;
      hasActivePromotion: boolean;
      candidateMarginPercent: number;
      basePrice: number;
    }
  >();

  for (const cp of coPurchases) {
    const product = store.get<Product>('Product', cp.coProductId);
    if (!product || existingProductIds.includes(product.id)) continue;

    const category = product.categoryId
      ? store.get<ProductCategory>('ProductCategory', product.categoryId)
      : null;

    const basePrice = Number(product.basePrice);
    const costPrice = Number(product.costPrice);
    const margin = basePrice > 0 ? ((basePrice - costPrice) / basePrice) * 100 : 0;
    const freq = Number(cp.frequency);

    const existing = candidateMap.get(product.id);
    if (!existing || freq > existing.coPurchaseFrequency) {
      candidateMap.set(product.id, {
        productId: product.id,
        productName: product.name,
        categoryName: category?.name ?? 'Unknown',
        coPurchaseFrequency: freq,
        hasActivePromotion: promotionSet.has(product.id),
        candidateMarginPercent: Math.round(margin * 100) / 100,
        basePrice,
      });
    }
  }

  // Also include products from direct upsell rules
  for (const rule of upsellRules) {
    const product = store.get<Product>('Product', rule.suggestedProductId);
    if (!product || existingProductIds.includes(product.id)) continue;

    if (!candidateMap.has(product.id)) {
      const category = product.categoryId
        ? store.get<ProductCategory>('ProductCategory', product.categoryId)
        : null;

      const basePrice = Number(product.basePrice);
      const costPrice = Number(product.costPrice);
      const margin = basePrice > 0 ? ((basePrice - costPrice) / basePrice) * 100 : 0;

      candidateMap.set(product.id, {
        productId: product.id,
        productName: product.name,
        categoryName: category?.name ?? 'Unknown',
        coPurchaseFrequency: 0.5, // rule baseline
        hasActivePromotion: rule.promotion,
        candidateMarginPercent: Math.round(margin * 100) / 100,
        basePrice,
      });
    }
  }

  const candidates = Array.from(candidateMap.values());
  return runUpsellEngine({ existingProductIds, candidates });
}


// src/demo/server/handlers/priceLists.ts
/**
 * Price lists mock handler: GET /api/price-lists
 */

import { router, jsonResponse } from '../router';
import { getStore } from '@/demo/db/store';
import { requireRole } from '../session';
import type { PriceList, PriceListItem } from '@/demo/db/schema';

export function registerPriceListsHandlers() {
  router.get('/api/price-lists', () => {
    requireRole(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS']);
    const store = getStore();

    const priceLists = store
      .where<PriceList>('PriceList', pl => pl.active)
      .sort((a, b) => a.name.localeCompare(b.name));

    const serialised = priceLists.map(pl => {
      const items = store.where<PriceListItem>('PriceListItem', item => item.priceListId === pl.id);
      return {
        id: pl.id,
        name: pl.name,
        currency: pl.currency,
        items: items.map(item => ({
          productId: item.productId,
          price: item.price.toString(),
        })),
      };
    });

    return jsonResponse({ success: true, data: serialised });
  });
}


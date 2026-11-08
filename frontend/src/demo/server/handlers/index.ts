// src/demo/server/handlers/index.ts
/**
 * Master handler registration for DealFlow360 simulated backend.
 */

import { registerAuthHandlers } from './auth';
import { registerUsersHandlers } from './users';
import { registerProductsHandlers } from './products';
import { registerPriceListsHandlers } from './priceLists';
import { registerCustomersHandlers } from './customers';
import { registerOnboardHandlers } from './onboard';
import { registerQuotesHandlers } from './quotes';
import { registerApprovalsHandlers } from './approvals';
import { registerOrdersHandlers } from './orders';
import { registerFulfillmentHandlers } from './fulfillment';
import { registerWarehousesHandlers } from './warehouses';
import { registerInvoicesHandlers } from './invoices';
import { registerBillingHandlers } from './billing';
import { registerSubscriptionsHandlers } from './subscriptions';
import { registerAdminHandlers } from './admin';
import { registerDealHealthHandlers } from './dealHealth';
import { registerAnalyticsHandlers } from './analytics';
import { registerReportsHandlers } from './reports';
import { registerAiHandlers } from './ai';
import { registerPortalHandlers } from './portal';

let registered = false;

export function registerAllHandlers() {
  if (registered) return;
  registered = true;

  registerAuthHandlers();
  registerUsersHandlers();
  registerProductsHandlers();
  registerPriceListsHandlers();
  registerCustomersHandlers();
  registerOnboardHandlers();
  registerQuotesHandlers();
  registerApprovalsHandlers();
  registerOrdersHandlers();
  registerFulfillmentHandlers();
  registerWarehousesHandlers();
  registerInvoicesHandlers();
  registerBillingHandlers();
  registerSubscriptionsHandlers();
  registerAdminHandlers();
  registerDealHealthHandlers();
  registerAnalyticsHandlers();
  registerReportsHandlers();
  registerAiHandlers();
  registerPortalHandlers();
}


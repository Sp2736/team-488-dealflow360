import PageClient from './PageClient';
import { SEEDED_SUBSCRIPTION_IDS } from '@/demo/db/seed/ids';

export function generateStaticParams() {
  return SEEDED_SUBSCRIPTION_IDS.map((subscriptionId) => ({ subscriptionId }));
}

export const dynamicParams = false;

export default function Page() {
  return <PageClient />;
}

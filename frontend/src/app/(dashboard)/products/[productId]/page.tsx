import PageClient from './PageClient';
import { SEEDED_PRODUCT_IDS } from '@/demo/db/seed/ids';

export function generateStaticParams() {
  return SEEDED_PRODUCT_IDS.map((productId) => ({ productId }));
}

export const dynamicParams = false;

export default function Page() {
  return <PageClient />;
}

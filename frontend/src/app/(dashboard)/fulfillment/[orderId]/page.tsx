import PageClient from './PageClient';
import { SEEDED_ORDER_IDS } from '@/demo/db/seed/ids';

export function generateStaticParams() {
  return SEEDED_ORDER_IDS.map((orderId) => ({ orderId }));
}

export const dynamicParams = false;

export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  return <PageClient params={params} />;
}

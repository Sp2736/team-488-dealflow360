import PageClient from './PageClient';
import { SEEDED_QUOTE_IDS } from '@/demo/db/seed/ids';

export function generateStaticParams() {
  return SEEDED_QUOTE_IDS.map((quotationId) => ({ quotationId }));
}

export const dynamicParams = false;

export default function Page() {
  return <PageClient />;
}

import PageClient from './PageClient';
import { SEEDED_INVOICE_IDS } from '@/demo/db/seed/ids';

export function generateStaticParams() {
  return SEEDED_INVOICE_IDS.map((invoiceId) => ({ invoiceId }));
}

export const dynamicParams = false;

export default function Page({ params }: { params: Promise<{ invoiceId: string }> }) {
  return <PageClient params={params} />;
}

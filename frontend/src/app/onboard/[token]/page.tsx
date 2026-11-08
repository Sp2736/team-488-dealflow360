import PageClient from './PageClient';
import { SEEDED_INVITE_TOKENS } from '@/demo/db/seed/ids';

export function generateStaticParams() {
  return SEEDED_INVITE_TOKENS.map((token) => ({ token }));
}

export const dynamicParams = false;

export default function Page() {
  return <PageClient />;
}

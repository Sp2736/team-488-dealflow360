'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/basePath';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(withBasePath('/login'));
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      background: 'var(--surface-sunken, #f4f4f0)',
      color: 'var(--fg, #111)',
      fontWeight: 600,
    }}>
      Redirecting to DealFlow360 Demo...
    </div>
  );
}

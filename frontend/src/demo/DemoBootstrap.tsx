// src/demo/DemoBootstrap.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { installDemoInterceptor } from './interceptor';
import { getStore } from './db/store';
import { getSessionOrNull } from './server/session';
import './db/seed'; // Registers deterministic seed generator

interface DemoBootstrapProps {
  children: React.ReactNode;
}

export function DemoBootstrap({ children }: DemoBootstrapProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 1. Install fetch interceptor
    installDemoInterceptor();

    // 2. Hydrate/seed database store
    getStore();

    // 3. Check session
    getSessionOrNull();

    // Fast boot transition
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fdfbf7]">
        <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000] text-center max-w-sm w-full mx-4">
          <div className="inline-block bg-black text-white text-xs font-black px-2 py-1 uppercase tracking-widest mb-3">
            Simulated Backend
          </div>
          <div className="text-xl font-black uppercase tracking-wider mb-2">
            DealFlow360
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Booting demo engines & store…
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


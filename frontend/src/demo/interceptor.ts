// src/demo/interceptor.ts
/**
 * Fail-closed window.fetch interceptor for DealFlow360 demo.
 * Directs all /api/* requests to the in-browser router, records execution
 * in the trace buffer, simulates realistic latency, and enforces network isolation.
 */

import { router } from './server/router';
import { registerAllHandlers } from './server/handlers';
import {
  addTraceEntry,
  resetActiveTraceContext,
  consumeFailureInjection,
} from './server/trace';
import { getSessionOrNull } from './server/session';

const INTERCEPTOR_SYMBOL = Symbol.for('df360.demo.interceptor');

function getBaseBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

function getSimulatedLatency(pathname: string): number {
  if (typeof window === 'undefined') return 0;

  const override = window.localStorage.getItem('df360.demo.latency');
  if (override !== null) {
    const val = Number(override);
    return isNaN(val) ? 0 : val;
  }

  // Heavy endpoints get an extra delay
  const isHeavy =
    pathname.includes('/evaluate') ||
    pathname.includes('/bulk-allocate') ||
    pathname.includes('/reports/summary') ||
    pathname.includes('/analytics');

  const base = 120 + Math.random() * 280;
  return Math.round(isHeavy ? base + 300 : base);
}

function delay(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    const timer = setTimeout(() => {
      resolve();
    }, ms);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true }
      );
    }
  });
}

/**
 * Installs the global fetch interceptor.
 */
export function installDemoInterceptor(): void {
  if (typeof window === 'undefined') return;

  // Ensure all mock handlers are registered
  registerAllHandlers();

  const win = window as any;
  if (win[INTERCEPTOR_SYMBOL]) return; // already installed

  const originalFetch: typeof window.fetch = win.fetch.bind(win);
  win[INTERCEPTOR_SYMBOL] = originalFetch;

  win.fetch = async function demoFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const origin = window.location.origin;
    let urlString = '';

    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else if (input && typeof (input as Request).url === 'string') {
      urlString = (input as Request).url;
    }

    const parsedUrl = new URL(urlString, origin);

    // 1. Cross-origin rejection
    if (parsedUrl.origin !== origin) {
      addTraceEntry({
        method: init?.method || (input instanceof Request ? input.method : 'GET'),
        path: urlString,
        status: 0,
        latencyMs: 0,
        actorRole: null,
        actorEmail: null,
        tablesRead: [],
        tablesWritten: [],
        requestBody: null,
        responseBody: { error: 'Network disabled in demo' },
      });
      throw new TypeError('Network disabled in demo');
    }

    // 2. Strip basePath
    const basePath = getBaseBasePath();
    let pathname = parsedUrl.pathname;
    if (basePath && pathname.startsWith(basePath)) {
      pathname = pathname.slice(basePath.length) || '/';
    }

    // 3. Static asset passthrough allowlist
    if (!pathname.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    // 4. API Request Handling
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const fullNormalizedPath = `${pathname}${parsedUrl.search}`;

    let requestBody: any = undefined;
    if (init?.body) {
      try {
        if (typeof init.body === 'string') {
          requestBody = JSON.parse(init.body);
        }
      } catch {
        requestBody = init.body;
      }
    } else if (input instanceof Request && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const cloned = input.clone();
        requestBody = await cloned.json();
      } catch {
        // Not JSON
      }
    }

    const session = getSessionOrNull();
    const startTime = performance.now();

    // Reset table read/written tracking for this call
    resetActiveTraceContext();

    // Check failure injection
    const shouldInjectFailure = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && consumeFailureInjection();

    // Artificial latency
    const signal = init?.signal || (input instanceof Request ? input.signal : null);
    const latency = getSimulatedLatency(pathname);
    if (latency > 0) {
      await delay(latency, signal);
    }

    let response: Response;

    if (shouldInjectFailure) {
      response = new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INJECTED_FAILURE',
            message: 'Simulated 500 failure injection from Trace Drawer',
          },
        }),
        {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }
      );
    } else {
      // Build Request object for router
      const reqInit: RequestInit = {
        method,
        headers: init?.headers,
        body: init?.body,
        signal,
      };
      const req = new Request(parsedUrl.toString(), reqInit);
      response = await router.handle(req, fullNormalizedPath);
    }

    const elapsed = Math.round(performance.now() - startTime);
    const { tablesRead, tablesWritten } = resetActiveTraceContext();

    let responseBody: any = undefined;
    try {
      const clonedRes = response.clone();
      responseBody = await clonedRes.json();
    } catch {
      // Not JSON
    }

    addTraceEntry({
      method,
      path: fullNormalizedPath,
      status: response.status,
      latencyMs: elapsed,
      actorRole: session?.user?.role || null,
      actorEmail: session?.user?.email || null,
      tablesRead,
      tablesWritten,
      requestBody,
      responseBody,
    });

    return response;
  };
}


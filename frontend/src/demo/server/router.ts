// src/demo/server/router.ts
/**
 * Mock HTTP Router for the browser-side simulated backend.
 * Matches method + parameterized paths, parses JSON bodies and query parameters,
 * and produces standard Web API Response objects.
 */

import { ApiError } from './errors';
import { getSessionOrNull, type DemoSession } from './session';
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/rbac.shared';

export interface DemoRequestContext {
  req: Request;
  url: URL;
  pathname: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: any;
  session: DemoSession | null;
}

export type RouteHandler = (ctx: DemoRequestContext) => Promise<Response | any> | Response | any;

interface RouteDefinition {
  method: string;
  pattern: string;
  regex: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

function patternToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  // Replace :param with named match group
  const regexStr = pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return {
    regex: new RegExp(`^${regexStr}$`),
    paramNames,
  };
}

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

export class MockRouter {
  private routes: RouteDefinition[] = [];

  register(method: string, pattern: string, handler: RouteHandler): void {
    const { regex, paramNames } = patternToRegex(pattern);
    this.routes.push({
      method: method.toUpperCase(),
      pattern,
      regex,
      paramNames,
      handler,
    });
  }

  get(pattern: string, handler: RouteHandler): void {
    this.register('GET', pattern, handler);
  }

  post(pattern: string, handler: RouteHandler): void {
    this.register('POST', pattern, handler);
  }

  put(pattern: string, handler: RouteHandler): void {
    this.register('PUT', pattern, handler);
  }

  patch(pattern: string, handler: RouteHandler): void {
    this.register('PATCH', pattern, handler);
  }

  delete(pattern: string, handler: RouteHandler): void {
    this.register('DELETE', pattern, handler);
  }

  findMatch(method: string, pathname: string): { route: RouteDefinition; params: Record<string, string> } | null {
    const m = method.toUpperCase();
    for (const route of this.routes) {
      if (route.method !== m) continue;
      const match = pathname.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { route, params };
      }
    }
    return null;
  }

  async handle(req: Request, normalizedPath: string): Promise<Response> {
    const url = new URL(normalizedPath, 'http://localhost');
    const pathname = url.pathname;
    const match = this.findMatch(req.method, pathname);

    if (!match) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Endpoint not found: ${req.method} ${pathname}`,
          },
        },
        404
      );
    }

    let parsedBody: any = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
      try {
        const cloned = req.clone();
        const text = await cloned.text();
        if (text && text.trim().length > 0) {
          parsedBody = JSON.parse(text);
        }
      } catch {
        // Body was not JSON or already consumed
      }
    }

    const session = getSessionOrNull();

    const ctx: DemoRequestContext = {
      req,
      url,
      pathname,
      query: url.searchParams,
      params: match.params,
      body: parsedBody,
      session,
    };

    try {
      const result = await match.route.handler(ctx);
      if (result instanceof Response) {
        return result;
      }
      return jsonResponse(result, 200);
    } catch (err: any) {
      if (err instanceof ApiError) {
        return jsonResponse(err.toJSON(), err.status);
      }
      if (err instanceof UnauthorizedError || err?.name === 'UnauthorizedError') {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: err.message || 'Unauthorized',
            },
          },
          401
        );
      }
      if (err instanceof ForbiddenError || err?.name === 'ForbiddenError') {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: err.message || 'Forbidden',
            },
          },
          403
        );
      }

      console.error(`[DealFlow360 Demo Router] Error handling ${req.method} ${pathname}:`, err);
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: err?.message || 'Internal server error',
          },
        },
        500
      );
    }
  }
}

// Global router singleton
export const router = new MockRouter();


// src/demo/server/trace.ts
/**
 * Request trace ring buffer and diagnostic context for the Backend Trace drawer.
 * Tracks method, path, status, latency, actor, touched tables, and payload samples.
 */

export interface TraceEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  actorRole: string | null;
  actorEmail: string | null;
  tablesRead: string[];
  tablesWritten: string[];
  requestBody?: unknown;
  responseBody?: unknown;
}

const MAX_TRACES = 100;
const traces: TraceEntry[] = [];
let traceListeners: Array<(traces: TraceEntry[]) => void> = [];

// Active request tracking context
let currentTablesRead = new Set<string>();
let currentTablesWritten = new Set<string>();

// Failure injection toggle for demonstrating error handling
let simulateFailureOnce = false;

export function getSimulateFailure(): boolean {
  return simulateFailureOnce;
}

export function setSimulateFailure(val: boolean): void {
  simulateFailureOnce = val;
}

export function consumeFailureInjection(): boolean {
  if (simulateFailureOnce) {
    simulateFailureOnce = false;
    return true;
  }
  return false;
}

export function recordTableRead(table: string): void {
  currentTablesRead.add(table);
}

export function recordTableWritten(table: string): void {
  currentTablesWritten.add(table);
}

export function resetActiveTraceContext(): { tablesRead: string[]; tablesWritten: string[] } {
  const read = Array.from(currentTablesRead);
  const written = Array.from(currentTablesWritten);
  currentTablesRead = new Set();
  currentTablesWritten = new Set();
  return { tablesRead: read, tablesWritten: written };
}

export function addTraceEntry(entry: Omit<TraceEntry, 'id' | 'timestamp'>): TraceEntry {
  const fullEntry: TraceEntry = {
    ...entry,
    id: `trc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  traces.unshift(fullEntry);
  if (traces.length > MAX_TRACES) {
    traces.pop();
  }

  // Notify listeners
  for (const listener of traceListeners) {
    try {
      listener([...traces]);
    } catch {
      // Ignore listener error
    }
  }

  return fullEntry;
}

export function getTraces(): TraceEntry[] {
  return [...traces];
}

export function clearTraces(): void {
  traces.length = 0;
  for (const listener of traceListeners) {
    try {
      listener([]);
    } catch {
      // Ignore
    }
  }
}

export function subscribeTraces(listener: (traces: TraceEntry[]) => void): () => void {
  traceListeners.push(listener);
  return () => {
    traceListeners = traceListeners.filter(l => l !== listener);
  };
}


// src/demo/db/seed/prng.ts
/**
 * Deterministic PRNG using Mulberry32.
 * Produces 100% reproducible pseudo-random numbers given a seed.
 */

export function createMulberry32(seed = 360) {
  let s = seed >>> 0;
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type PRNG = () => number;

export function randInt(rng: PRNG, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randFloat(rng: PRNG, min: number, max: number, decimals = 2): number {
  const val = rng() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

export function randChoice<T>(rng: PRNG, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function randSample<T>(rng: PRNG, items: readonly T[], count: number): T[] {
  const clone = [...items];
  const result: T[] = [];
  const n = Math.min(count, items.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * clone.length);
    result.push(clone[idx]);
    clone.splice(idx, 1);
  }
  return result;
}

export function padZero(num: number, size = 4): string {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}


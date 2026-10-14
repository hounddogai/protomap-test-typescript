/**
 * An in-memory cache with a time to live and a capacity.
 */

import * as clock from "./clock.js";

/** TtlCache keeps up to capacity values for ttl seconds each, evicting the oldest first. */
export interface TtlCache<V> {
  get(key: string): V | undefined;
  put(key: string, value: V): void;
  size(): number;
  purgeExpired(): number;
}

/**
 * Starts an empty cache. Its entries live in the closure, not on an object, so nothing outside the cache can read or
 * replace them.
 */
export function newTtlCache<V>(capacity: number, ttl: number, clockValue: clock.Clock): TtlCache<V> {
  const entries = new Map<string, V>();
  const expires = new Map<string, number>();
  let order: string[] = [];
  return {
    get(key: string): V | undefined {
      const deadline = expires.get(key);
      if (deadline === undefined) return undefined;
      if (clockValue.now() > deadline) {
        entries.delete(key);
        expires.delete(key);
        return undefined;
      }
      return entries.get(key);
    },
    put(key: string, value: V): void {
      if (!entries.has(key)) order.push(key);
      entries.set(key, value);
      expires.set(key, clockValue.now() + ttl);
      while (order.length > capacity && order.length > 0) {
        const oldest = order[0]!;
        order = order.slice(1);
        entries.delete(oldest);
        expires.delete(oldest);
      }
    },
    size(): number {
      return entries.size;
    },
    purgeExpired(): number {
      const now = clockValue.now();
      const kept: string[] = [];
      let removed = 0;
      for (const key of order) {
        if (now > (expires.get(key) ?? 0)) {
          entries.delete(key);
          expires.delete(key);
          removed += 1;
          continue;
        }
        kept.push(key);
      }
      order = kept;
      return removed;
    },
  };
}

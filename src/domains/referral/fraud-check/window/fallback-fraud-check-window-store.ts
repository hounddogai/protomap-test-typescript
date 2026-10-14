import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackFraudCheckWindow } from "./fallback-fraud-check-window.js";

/** Keeps fallback fraud check windows by code. */
export interface FallbackFraudCheckWindowStore {
  find(code: string): FallbackFraudCheckWindow | undefined;
  save(item: FallbackFraudCheckWindow): void;
  remove(code: string): boolean;
  list(): FallbackFraudCheckWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackFraudCheckWindowStore implements FallbackFraudCheckWindowStore {
  items: Map<string, FallbackFraudCheckWindow>;
  order: string[];

  constructor(items: Map<string, FallbackFraudCheckWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackFraudCheckWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackFraudCheckWindow): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): FallbackFraudCheckWindow[] {
    const out: FallbackFraudCheckWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackFraudCheckWindowStore(): FallbackFraudCheckWindowStore {
  return new MemoryFallbackFraudCheckWindowStore(new Map<string, FallbackFraudCheckWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackFraudCheckWindowStore implements FallbackFraudCheckWindowStore {
  inner: FallbackFraudCheckWindowStore;
  cache: cache.TtlCache<FallbackFraudCheckWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackFraudCheckWindowStore,
    cacheValue: cache.TtlCache<FallbackFraudCheckWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackFraudCheckWindow | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: FallbackFraudCheckWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackFraudCheckWindow[] {
    return this.inner.list();
  }
}

export function newCachedFallbackFraudCheckWindowStore(inner: FallbackFraudCheckWindowStore, ttl: number, clockValue: clock.Clock): FallbackFraudCheckWindowStore {
  return new CachedFallbackFraudCheckWindowStore(
    inner,
    cache.newTtlCache<FallbackFraudCheckWindow>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback fraud check windows. Empty fields match all. */
export class FallbackFraudCheckWindowQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackFraudCheckWindow): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackFraudCheckWindow[]): FallbackFraudCheckWindow[] {
    const matched = collections.filter(items, (candidate: FallbackFraudCheckWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackFraudCheckWindows(store: FallbackFraudCheckWindowStore, query: FallbackFraudCheckWindowQuery): FallbackFraudCheckWindow[] {
  return query.apply(store.list());
}

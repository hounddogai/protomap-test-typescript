import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientTierWindow } from "./lenient-tier-window.js";

/** Keeps lenient tier windows by code. */
export interface LenientTierWindowStore {
  find(code: string): LenientTierWindow | undefined;
  save(item: LenientTierWindow): void;
  remove(code: string): boolean;
  list(): LenientTierWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientTierWindowStore implements LenientTierWindowStore {
  items: Map<string, LenientTierWindow>;
  order: string[];

  constructor(items: Map<string, LenientTierWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientTierWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientTierWindow): void {
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

  list(): LenientTierWindow[] {
    const out: LenientTierWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientTierWindowStore(): LenientTierWindowStore {
  return new MemoryLenientTierWindowStore(new Map<string, LenientTierWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientTierWindowStore implements LenientTierWindowStore {
  inner: LenientTierWindowStore;
  cache: cache.TtlCache<LenientTierWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientTierWindowStore,
    cacheValue: cache.TtlCache<LenientTierWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientTierWindow | undefined {
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

  save(item: LenientTierWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientTierWindow[] {
    return this.inner.list();
  }
}

export function newCachedLenientTierWindowStore(inner: LenientTierWindowStore, ttl: number, clockValue: clock.Clock): LenientTierWindowStore {
  return new CachedLenientTierWindowStore(inner, cache.newTtlCache<LenientTierWindow>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient tier windows. Empty fields match all. */
export class LenientTierWindowQuery {
  category: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBatchSize: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientTierWindow): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientTierWindow[]): LenientTierWindow[] {
    const matched = collections.filter(items, (candidate: LenientTierWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientTierWindows(store: LenientTierWindowStore, query: LenientTierWindowQuery): LenientTierWindow[] {
  return query.apply(store.list());
}

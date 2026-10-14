import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackInsightAdjustment } from "./fallback-insight-adjustment.js";

/** Keeps fallback insight adjustments by code. */
export interface FallbackInsightAdjustmentStore {
  find(code: string): FallbackInsightAdjustment | undefined;
  save(item: FallbackInsightAdjustment): void;
  remove(code: string): boolean;
  list(): FallbackInsightAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackInsightAdjustmentStore implements FallbackInsightAdjustmentStore {
  items: Map<string, FallbackInsightAdjustment>;
  order: string[];

  constructor(items: Map<string, FallbackInsightAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackInsightAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackInsightAdjustment): void {
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

  list(): FallbackInsightAdjustment[] {
    const out: FallbackInsightAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackInsightAdjustmentStore(): FallbackInsightAdjustmentStore {
  return new MemoryFallbackInsightAdjustmentStore(new Map<string, FallbackInsightAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackInsightAdjustmentStore implements FallbackInsightAdjustmentStore {
  inner: FallbackInsightAdjustmentStore;
  cache: cache.TtlCache<FallbackInsightAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackInsightAdjustmentStore,
    cacheValue: cache.TtlCache<FallbackInsightAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackInsightAdjustment | undefined {
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

  save(item: FallbackInsightAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackInsightAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedFallbackInsightAdjustmentStore(inner: FallbackInsightAdjustmentStore, ttl: number, clockValue: clock.Clock): FallbackInsightAdjustmentStore {
  return new CachedFallbackInsightAdjustmentStore(
    inner,
    cache.newTtlCache<FallbackInsightAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback insight adjustments. Empty fields match all. */
export class FallbackInsightAdjustmentQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackInsightAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackInsightAdjustment[]): FallbackInsightAdjustment[] {
    const matched = collections.filter(items, (candidate: FallbackInsightAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackInsightAdjustments(store: FallbackInsightAdjustmentStore, query: FallbackInsightAdjustmentQuery): FallbackInsightAdjustment[] {
  return query.apply(store.list());
}

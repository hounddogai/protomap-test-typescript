import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackFunnelBatch } from "./fallback-funnel-batch.js";

/** Keeps fallback funnel batches by code. */
export interface FallbackFunnelBatchStore {
  find(code: string): FallbackFunnelBatch | undefined;
  save(item: FallbackFunnelBatch): void;
  remove(code: string): boolean;
  list(): FallbackFunnelBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackFunnelBatchStore implements FallbackFunnelBatchStore {
  items: Map<string, FallbackFunnelBatch>;
  order: string[];

  constructor(items: Map<string, FallbackFunnelBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackFunnelBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackFunnelBatch): void {
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

  list(): FallbackFunnelBatch[] {
    const out: FallbackFunnelBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackFunnelBatchStore(): FallbackFunnelBatchStore {
  return new MemoryFallbackFunnelBatchStore(new Map<string, FallbackFunnelBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackFunnelBatchStore implements FallbackFunnelBatchStore {
  inner: FallbackFunnelBatchStore;
  cache: cache.TtlCache<FallbackFunnelBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackFunnelBatchStore,
    cacheValue: cache.TtlCache<FallbackFunnelBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackFunnelBatch | undefined {
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

  save(item: FallbackFunnelBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackFunnelBatch[] {
    return this.inner.list();
  }
}

export function newCachedFallbackFunnelBatchStore(inner: FallbackFunnelBatchStore, ttl: number, clockValue: clock.Clock): FallbackFunnelBatchStore {
  return new CachedFallbackFunnelBatchStore(inner, cache.newTtlCache<FallbackFunnelBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects fallback funnel batches. Empty fields match all. */
export class FallbackFunnelBatchQuery {
  country: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMaximum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackFunnelBatch): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackFunnelBatch[]): FallbackFunnelBatch[] {
    const matched = collections.filter(items, (candidate: FallbackFunnelBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackFunnelBatches(store: FallbackFunnelBatchStore, query: FallbackFunnelBatchQuery): FallbackFunnelBatch[] {
  return query.apply(store.list());
}

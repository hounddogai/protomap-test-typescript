import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackFunnelEstimate } from "./fallback-funnel-estimate.js";

/** Keeps fallback funnel estimates by code. */
export interface FallbackFunnelEstimateStore {
  find(code: string): FallbackFunnelEstimate | undefined;
  save(item: FallbackFunnelEstimate): void;
  remove(code: string): boolean;
  list(): FallbackFunnelEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackFunnelEstimateStore implements FallbackFunnelEstimateStore {
  items: Map<string, FallbackFunnelEstimate>;
  order: string[];

  constructor(items: Map<string, FallbackFunnelEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackFunnelEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackFunnelEstimate): void {
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

  list(): FallbackFunnelEstimate[] {
    const out: FallbackFunnelEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackFunnelEstimateStore(): FallbackFunnelEstimateStore {
  return new MemoryFallbackFunnelEstimateStore(new Map<string, FallbackFunnelEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackFunnelEstimateStore implements FallbackFunnelEstimateStore {
  inner: FallbackFunnelEstimateStore;
  cache: cache.TtlCache<FallbackFunnelEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackFunnelEstimateStore,
    cacheValue: cache.TtlCache<FallbackFunnelEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackFunnelEstimate | undefined {
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

  save(item: FallbackFunnelEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackFunnelEstimate[] {
    return this.inner.list();
  }
}

export function newCachedFallbackFunnelEstimateStore(inner: FallbackFunnelEstimateStore, ttl: number, clockValue: clock.Clock): FallbackFunnelEstimateStore {
  return new CachedFallbackFunnelEstimateStore(
    inner,
    cache.newTtlCache<FallbackFunnelEstimate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback funnel estimates. Empty fields match all. */
export class FallbackFunnelEstimateQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackFunnelEstimate): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackFunnelEstimate[]): FallbackFunnelEstimate[] {
    const matched = collections.filter(items, (candidate: FallbackFunnelEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackFunnelEstimates(store: FallbackFunnelEstimateStore, query: FallbackFunnelEstimateQuery): FallbackFunnelEstimate[] {
  return query.apply(store.list());
}

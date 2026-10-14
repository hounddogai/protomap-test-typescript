import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupEstimate } from "./warmup-estimate.js";

/** Keeps warmup estimates by code. */
export interface WarmupEstimateStore {
  find(code: string): WarmupEstimate | undefined;
  save(item: WarmupEstimate): void;
  remove(code: string): boolean;
  list(): WarmupEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupEstimateStore implements WarmupEstimateStore {
  items: Map<string, WarmupEstimate>;
  order: string[];

  constructor(items: Map<string, WarmupEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupEstimate): void {
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

  list(): WarmupEstimate[] {
    const out: WarmupEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupEstimateStore(): WarmupEstimateStore {
  return new MemoryWarmupEstimateStore(new Map<string, WarmupEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupEstimateStore implements WarmupEstimateStore {
  inner: WarmupEstimateStore;
  cache: cache.TtlCache<WarmupEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupEstimateStore,
    cacheValue: cache.TtlCache<WarmupEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupEstimate | undefined {
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

  save(item: WarmupEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupEstimate[] {
    return this.inner.list();
  }
}

export function newCachedWarmupEstimateStore(inner: WarmupEstimateStore, ttl: number, clockValue: clock.Clock): WarmupEstimateStore {
  return new CachedWarmupEstimateStore(inner, cache.newTtlCache<WarmupEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects warmup estimates. Empty fields match all. */
export class WarmupEstimateQuery {
  utmSource: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFloorValue: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupEstimate): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupEstimate[]): WarmupEstimate[] {
    const matched = collections.filter(items, (candidate: WarmupEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupEstimates(store: WarmupEstimateStore, query: WarmupEstimateQuery): WarmupEstimate[] {
  return query.apply(store.list());
}

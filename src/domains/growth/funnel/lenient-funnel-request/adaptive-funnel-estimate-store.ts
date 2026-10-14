import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

/** Keeps adaptive funnel estimates by code. */
export interface AdaptiveFunnelEstimateStore {
  find(code: string): AdaptiveFunnelEstimate | undefined;
  save(item: AdaptiveFunnelEstimate): void;
  remove(code: string): boolean;
  list(): AdaptiveFunnelEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFunnelEstimateStore implements AdaptiveFunnelEstimateStore {
  items: Map<string, AdaptiveFunnelEstimate>;
  order: string[];

  constructor(items: Map<string, AdaptiveFunnelEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFunnelEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFunnelEstimate): void {
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

  list(): AdaptiveFunnelEstimate[] {
    const out: AdaptiveFunnelEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFunnelEstimateStore(): AdaptiveFunnelEstimateStore {
  return new MemoryAdaptiveFunnelEstimateStore(new Map<string, AdaptiveFunnelEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFunnelEstimateStore implements AdaptiveFunnelEstimateStore {
  inner: AdaptiveFunnelEstimateStore;
  cache: cache.TtlCache<AdaptiveFunnelEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFunnelEstimateStore,
    cacheValue: cache.TtlCache<AdaptiveFunnelEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFunnelEstimate | undefined {
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

  save(item: AdaptiveFunnelEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFunnelEstimate[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFunnelEstimateStore(inner: AdaptiveFunnelEstimateStore, ttl: number, clockValue: clock.Clock): AdaptiveFunnelEstimateStore {
  return new CachedAdaptiveFunnelEstimateStore(
    inner,
    cache.newTtlCache<AdaptiveFunnelEstimate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive funnel estimates. Empty fields match all. */
export class AdaptiveFunnelEstimateQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFunnelEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFunnelEstimate[]): AdaptiveFunnelEstimate[] {
    const matched = collections.filter(items, (candidate: AdaptiveFunnelEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFunnelEstimates(store: AdaptiveFunnelEstimateStore, query: AdaptiveFunnelEstimateQuery): AdaptiveFunnelEstimate[] {
  return query.apply(store.list());
}

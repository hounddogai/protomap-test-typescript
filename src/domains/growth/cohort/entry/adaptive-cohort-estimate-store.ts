import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

/** Keeps adaptive cohort estimates by code. */
export interface AdaptiveCohortEstimateStore {
  find(code: string): AdaptiveCohortEstimate | undefined;
  save(item: AdaptiveCohortEstimate): void;
  remove(code: string): boolean;
  list(): AdaptiveCohortEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCohortEstimateStore implements AdaptiveCohortEstimateStore {
  items: Map<string, AdaptiveCohortEstimate>;
  order: string[];

  constructor(items: Map<string, AdaptiveCohortEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCohortEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCohortEstimate): void {
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

  list(): AdaptiveCohortEstimate[] {
    const out: AdaptiveCohortEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCohortEstimateStore(): AdaptiveCohortEstimateStore {
  return new MemoryAdaptiveCohortEstimateStore(new Map<string, AdaptiveCohortEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCohortEstimateStore implements AdaptiveCohortEstimateStore {
  inner: AdaptiveCohortEstimateStore;
  cache: cache.TtlCache<AdaptiveCohortEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCohortEstimateStore,
    cacheValue: cache.TtlCache<AdaptiveCohortEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCohortEstimate | undefined {
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

  save(item: AdaptiveCohortEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCohortEstimate[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCohortEstimateStore(inner: AdaptiveCohortEstimateStore, ttl: number, clockValue: clock.Clock): AdaptiveCohortEstimateStore {
  return new CachedAdaptiveCohortEstimateStore(
    inner,
    cache.newTtlCache<AdaptiveCohortEstimate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive cohort estimates. Empty fields match all. */
export class AdaptiveCohortEstimateQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCohortEstimate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCohortEstimate[]): AdaptiveCohortEstimate[] {
    const matched = collections.filter(items, (candidate: AdaptiveCohortEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCohortEstimates(store: AdaptiveCohortEstimateStore, query: AdaptiveCohortEstimateQuery): AdaptiveCohortEstimate[] {
  return query.apply(store.list());
}

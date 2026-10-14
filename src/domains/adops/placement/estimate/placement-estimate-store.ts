import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementEstimate } from "./placement-estimate.js";

/** Keeps placement estimates by code. */
export interface PlacementEstimateStore {
  find(code: string): PlacementEstimate | undefined;
  save(item: PlacementEstimate): void;
  remove(code: string): boolean;
  list(): PlacementEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementEstimateStore implements PlacementEstimateStore {
  items: Map<string, PlacementEstimate>;
  order: string[];

  constructor(items: Map<string, PlacementEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementEstimate): void {
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

  list(): PlacementEstimate[] {
    const out: PlacementEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementEstimateStore(): PlacementEstimateStore {
  return new MemoryPlacementEstimateStore(new Map<string, PlacementEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementEstimateStore implements PlacementEstimateStore {
  inner: PlacementEstimateStore;
  cache: cache.TtlCache<PlacementEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementEstimateStore,
    cacheValue: cache.TtlCache<PlacementEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementEstimate | undefined {
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

  save(item: PlacementEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPlacementEstimateStore(inner: PlacementEstimateStore, ttl: number, clockValue: clock.Clock): PlacementEstimateStore {
  return new CachedPlacementEstimateStore(inner, cache.newTtlCache<PlacementEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects placement estimates. Empty fields match all. */
export class PlacementEstimateQuery {
  locale: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementEstimate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementEstimate[]): PlacementEstimate[] {
    const matched = collections.filter(items, (candidate: PlacementEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementEstimates(store: PlacementEstimateStore, query: PlacementEstimateQuery): PlacementEstimate[] {
  return query.apply(store.list());
}

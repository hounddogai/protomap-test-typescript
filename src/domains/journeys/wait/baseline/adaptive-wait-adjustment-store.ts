import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveWaitAdjustment } from "./adaptive-wait-adjustment.js";

/** Keeps adaptive wait adjustments by code. */
export interface AdaptiveWaitAdjustmentStore {
  find(code: string): AdaptiveWaitAdjustment | undefined;
  save(item: AdaptiveWaitAdjustment): void;
  remove(code: string): boolean;
  list(): AdaptiveWaitAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveWaitAdjustmentStore implements AdaptiveWaitAdjustmentStore {
  items: Map<string, AdaptiveWaitAdjustment>;
  order: string[];

  constructor(items: Map<string, AdaptiveWaitAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveWaitAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveWaitAdjustment): void {
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

  list(): AdaptiveWaitAdjustment[] {
    const out: AdaptiveWaitAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveWaitAdjustmentStore(): AdaptiveWaitAdjustmentStore {
  return new MemoryAdaptiveWaitAdjustmentStore(new Map<string, AdaptiveWaitAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveWaitAdjustmentStore implements AdaptiveWaitAdjustmentStore {
  inner: AdaptiveWaitAdjustmentStore;
  cache: cache.TtlCache<AdaptiveWaitAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveWaitAdjustmentStore,
    cacheValue: cache.TtlCache<AdaptiveWaitAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveWaitAdjustment | undefined {
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

  save(item: AdaptiveWaitAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveWaitAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveWaitAdjustmentStore(inner: AdaptiveWaitAdjustmentStore, ttl: number, clockValue: clock.Clock): AdaptiveWaitAdjustmentStore {
  return new CachedAdaptiveWaitAdjustmentStore(
    inner,
    cache.newTtlCache<AdaptiveWaitAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive wait adjustments. Empty fields match all. */
export class AdaptiveWaitAdjustmentQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveWaitAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveWaitAdjustment[]): AdaptiveWaitAdjustment[] {
    const matched = collections.filter(items, (candidate: AdaptiveWaitAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveWaitAdjustments(store: AdaptiveWaitAdjustmentStore, query: AdaptiveWaitAdjustmentQuery): AdaptiveWaitAdjustment[] {
  return query.apply(store.list());
}

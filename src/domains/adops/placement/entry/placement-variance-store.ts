import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementVariance } from "./placement-variance.js";

/** Keeps placement variances by code. */
export interface PlacementVarianceStore {
  find(code: string): PlacementVariance | undefined;
  save(item: PlacementVariance): void;
  remove(code: string): boolean;
  list(): PlacementVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementVarianceStore implements PlacementVarianceStore {
  items: Map<string, PlacementVariance>;
  order: string[];

  constructor(items: Map<string, PlacementVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementVariance): void {
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

  list(): PlacementVariance[] {
    const out: PlacementVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementVarianceStore(): PlacementVarianceStore {
  return new MemoryPlacementVarianceStore(new Map<string, PlacementVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementVarianceStore implements PlacementVarianceStore {
  inner: PlacementVarianceStore;
  cache: cache.TtlCache<PlacementVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementVarianceStore,
    cacheValue: cache.TtlCache<PlacementVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementVariance | undefined {
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

  save(item: PlacementVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementVariance[] {
    return this.inner.list();
  }
}

export function newCachedPlacementVarianceStore(inner: PlacementVarianceStore, ttl: number, clockValue: clock.Clock): PlacementVarianceStore {
  return new CachedPlacementVarianceStore(inner, cache.newTtlCache<PlacementVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects placement variances. Empty fields match all. */
export class PlacementVarianceQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementVariance): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementVariance[]): PlacementVariance[] {
    const matched = collections.filter(items, (candidate: PlacementVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementVariances(store: PlacementVarianceStore, query: PlacementVarianceQuery): PlacementVariance[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedWindowRequest } from "./weighted-window-request.js";

/** Keeps weighted window requests by code. */
export interface WeightedWindowRequestStore {
  find(code: string): WeightedWindowRequest | undefined;
  save(item: WeightedWindowRequest): void;
  remove(code: string): boolean;
  list(): WeightedWindowRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedWindowRequestStore implements WeightedWindowRequestStore {
  items: Map<string, WeightedWindowRequest>;
  order: string[];

  constructor(items: Map<string, WeightedWindowRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedWindowRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedWindowRequest): void {
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

  list(): WeightedWindowRequest[] {
    const out: WeightedWindowRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedWindowRequestStore(): WeightedWindowRequestStore {
  return new MemoryWeightedWindowRequestStore(new Map<string, WeightedWindowRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedWindowRequestStore implements WeightedWindowRequestStore {
  inner: WeightedWindowRequestStore;
  cache: cache.TtlCache<WeightedWindowRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedWindowRequestStore,
    cacheValue: cache.TtlCache<WeightedWindowRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedWindowRequest | undefined {
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

  save(item: WeightedWindowRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedWindowRequest[] {
    return this.inner.list();
  }
}

export function newCachedWeightedWindowRequestStore(inner: WeightedWindowRequestStore, ttl: number, clockValue: clock.Clock): WeightedWindowRequestStore {
  return new CachedWeightedWindowRequestStore(
    inner,
    cache.newTtlCache<WeightedWindowRequest>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted window requests. Empty fields match all. */
export class WeightedWindowRequestQuery {
  country: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBid: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedWindowRequest): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedWindowRequest[]): WeightedWindowRequest[] {
    const matched = collections.filter(items, (candidate: WeightedWindowRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedWindowRequests(store: WeightedWindowRequestStore, query: WeightedWindowRequestQuery): WeightedWindowRequest[] {
  return query.apply(store.list());
}

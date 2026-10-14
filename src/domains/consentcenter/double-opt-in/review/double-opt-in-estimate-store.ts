import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInEstimate } from "./double-opt-in-estimate.js";

/** Keeps double opt in estimates by code. */
export interface DoubleOptInEstimateStore {
  find(code: string): DoubleOptInEstimate | undefined;
  save(item: DoubleOptInEstimate): void;
  remove(code: string): boolean;
  list(): DoubleOptInEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInEstimateStore implements DoubleOptInEstimateStore {
  items: Map<string, DoubleOptInEstimate>;
  order: string[];

  constructor(items: Map<string, DoubleOptInEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInEstimate): void {
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

  list(): DoubleOptInEstimate[] {
    const out: DoubleOptInEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInEstimateStore(): DoubleOptInEstimateStore {
  return new MemoryDoubleOptInEstimateStore(new Map<string, DoubleOptInEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInEstimateStore implements DoubleOptInEstimateStore {
  inner: DoubleOptInEstimateStore;
  cache: cache.TtlCache<DoubleOptInEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInEstimateStore,
    cacheValue: cache.TtlCache<DoubleOptInEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInEstimate | undefined {
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

  save(item: DoubleOptInEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInEstimate[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInEstimateStore(inner: DoubleOptInEstimateStore, ttl: number, clockValue: clock.Clock): DoubleOptInEstimateStore {
  return new CachedDoubleOptInEstimateStore(inner, cache.newTtlCache<DoubleOptInEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects double opt in estimates. Empty fields match all. */
export class DoubleOptInEstimateQuery {
  country: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minStartsAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInEstimate): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInEstimate[]): DoubleOptInEstimate[] {
    const matched = collections.filter(items, (candidate: DoubleOptInEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInEstimates(store: DoubleOptInEstimateStore, query: DoubleOptInEstimateQuery): DoubleOptInEstimate[] {
  return query.apply(store.list());
}

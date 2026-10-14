import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedCsatCycle } from "./weighted-csat-cycle.js";

/** Keeps weighted csat cycles by code. */
export interface WeightedCsatCycleStore {
  find(code: string): WeightedCsatCycle | undefined;
  save(item: WeightedCsatCycle): void;
  remove(code: string): boolean;
  list(): WeightedCsatCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedCsatCycleStore implements WeightedCsatCycleStore {
  items: Map<string, WeightedCsatCycle>;
  order: string[];

  constructor(items: Map<string, WeightedCsatCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedCsatCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedCsatCycle): void {
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

  list(): WeightedCsatCycle[] {
    const out: WeightedCsatCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedCsatCycleStore(): WeightedCsatCycleStore {
  return new MemoryWeightedCsatCycleStore(new Map<string, WeightedCsatCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedCsatCycleStore implements WeightedCsatCycleStore {
  inner: WeightedCsatCycleStore;
  cache: cache.TtlCache<WeightedCsatCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedCsatCycleStore,
    cacheValue: cache.TtlCache<WeightedCsatCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedCsatCycle | undefined {
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

  save(item: WeightedCsatCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedCsatCycle[] {
    return this.inner.list();
  }
}

export function newCachedWeightedCsatCycleStore(inner: WeightedCsatCycleStore, ttl: number, clockValue: clock.Clock): WeightedCsatCycleStore {
  return new CachedWeightedCsatCycleStore(inner, cache.newTtlCache<WeightedCsatCycle>(256, ttl, clockValue), 0, 0);
}

/** Selects weighted csat cycles. Empty fields match all. */
export class WeightedCsatCycleQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedCsatCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedCsatCycle[]): WeightedCsatCycle[] {
    const matched = collections.filter(items, (candidate: WeightedCsatCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedCsatCycles(store: WeightedCsatCycleStore, query: WeightedCsatCycleQuery): WeightedCsatCycle[] {
  return query.apply(store.list());
}

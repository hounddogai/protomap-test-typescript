import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedSubscriptionCycle } from "./weighted-subscription-cycle.js";

/** Keeps weighted subscription cycles by code. */
export interface WeightedSubscriptionCycleStore {
  find(code: string): WeightedSubscriptionCycle | undefined;
  save(item: WeightedSubscriptionCycle): void;
  remove(code: string): boolean;
  list(): WeightedSubscriptionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedSubscriptionCycleStore implements WeightedSubscriptionCycleStore {
  items: Map<string, WeightedSubscriptionCycle>;
  order: string[];

  constructor(items: Map<string, WeightedSubscriptionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedSubscriptionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedSubscriptionCycle): void {
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

  list(): WeightedSubscriptionCycle[] {
    const out: WeightedSubscriptionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedSubscriptionCycleStore(): WeightedSubscriptionCycleStore {
  return new MemoryWeightedSubscriptionCycleStore(new Map<string, WeightedSubscriptionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedSubscriptionCycleStore implements WeightedSubscriptionCycleStore {
  inner: WeightedSubscriptionCycleStore;
  cache: cache.TtlCache<WeightedSubscriptionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedSubscriptionCycleStore,
    cacheValue: cache.TtlCache<WeightedSubscriptionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedSubscriptionCycle | undefined {
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

  save(item: WeightedSubscriptionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedSubscriptionCycle[] {
    return this.inner.list();
  }
}

export function newCachedWeightedSubscriptionCycleStore(inner: WeightedSubscriptionCycleStore, ttl: number, clockValue: clock.Clock): WeightedSubscriptionCycleStore {
  return new CachedWeightedSubscriptionCycleStore(
    inner,
    cache.newTtlCache<WeightedSubscriptionCycle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted subscription cycles. Empty fields match all. */
export class WeightedSubscriptionCycleQuery {
  source: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minLimit: number, statuses: string[], limit: number) {
    this.source = source;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedSubscriptionCycle): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedSubscriptionCycle[]): WeightedSubscriptionCycle[] {
    const matched = collections.filter(items, (candidate: WeightedSubscriptionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedSubscriptionCycles(store: WeightedSubscriptionCycleStore, query: WeightedSubscriptionCycleQuery): WeightedSubscriptionCycle[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedWaitSlot } from "./weighted-wait-slot.js";

/** Keeps weighted wait slots by code. */
export interface WeightedWaitSlotStore {
  find(code: string): WeightedWaitSlot | undefined;
  save(item: WeightedWaitSlot): void;
  remove(code: string): boolean;
  list(): WeightedWaitSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedWaitSlotStore implements WeightedWaitSlotStore {
  items: Map<string, WeightedWaitSlot>;
  order: string[];

  constructor(items: Map<string, WeightedWaitSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedWaitSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedWaitSlot): void {
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

  list(): WeightedWaitSlot[] {
    const out: WeightedWaitSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedWaitSlotStore(): WeightedWaitSlotStore {
  return new MemoryWeightedWaitSlotStore(new Map<string, WeightedWaitSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedWaitSlotStore implements WeightedWaitSlotStore {
  inner: WeightedWaitSlotStore;
  cache: cache.TtlCache<WeightedWaitSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedWaitSlotStore,
    cacheValue: cache.TtlCache<WeightedWaitSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedWaitSlot | undefined {
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

  save(item: WeightedWaitSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedWaitSlot[] {
    return this.inner.list();
  }
}

export function newCachedWeightedWaitSlotStore(inner: WeightedWaitSlotStore, ttl: number, clockValue: clock.Clock): WeightedWaitSlotStore {
  return new CachedWeightedWaitSlotStore(inner, cache.newTtlCache<WeightedWaitSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects weighted wait slots. Empty fields match all. */
export class WeightedWaitSlotQuery {
  locale: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWeight: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedWaitSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedWaitSlot[]): WeightedWaitSlot[] {
    const matched = collections.filter(items, (candidate: WeightedWaitSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedWaitSlots(store: WeightedWaitSlotStore, query: WeightedWaitSlotQuery): WeightedWaitSlot[] {
  return query.apply(store.list());
}

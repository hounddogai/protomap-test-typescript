import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedCreditSlot } from "./weighted-credit-slot.js";

/** Keeps weighted credit slots by code. */
export interface WeightedCreditSlotStore {
  find(code: string): WeightedCreditSlot | undefined;
  save(item: WeightedCreditSlot): void;
  remove(code: string): boolean;
  list(): WeightedCreditSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedCreditSlotStore implements WeightedCreditSlotStore {
  items: Map<string, WeightedCreditSlot>;
  order: string[];

  constructor(items: Map<string, WeightedCreditSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedCreditSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedCreditSlot): void {
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

  list(): WeightedCreditSlot[] {
    const out: WeightedCreditSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedCreditSlotStore(): WeightedCreditSlotStore {
  return new MemoryWeightedCreditSlotStore(new Map<string, WeightedCreditSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedCreditSlotStore implements WeightedCreditSlotStore {
  inner: WeightedCreditSlotStore;
  cache: cache.TtlCache<WeightedCreditSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedCreditSlotStore,
    cacheValue: cache.TtlCache<WeightedCreditSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedCreditSlot | undefined {
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

  save(item: WeightedCreditSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedCreditSlot[] {
    return this.inner.list();
  }
}

export function newCachedWeightedCreditSlotStore(inner: WeightedCreditSlotStore, ttl: number, clockValue: clock.Clock): WeightedCreditSlotStore {
  return new CachedWeightedCreditSlotStore(inner, cache.newTtlCache<WeightedCreditSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects weighted credit slots. Empty fields match all. */
export class WeightedCreditSlotQuery {
  locale: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCost: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedCreditSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedCreditSlot[]): WeightedCreditSlot[] {
    const matched = collections.filter(items, (candidate: WeightedCreditSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedCreditSlots(store: WeightedCreditSlotStore, query: WeightedCreditSlotQuery): WeightedCreditSlot[] {
  return query.apply(store.list());
}

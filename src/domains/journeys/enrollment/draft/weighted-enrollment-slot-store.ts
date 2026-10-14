import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

/** Keeps weighted enrollment slots by code. */
export interface WeightedEnrollmentSlotStore {
  find(code: string): WeightedEnrollmentSlot | undefined;
  save(item: WeightedEnrollmentSlot): void;
  remove(code: string): boolean;
  list(): WeightedEnrollmentSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedEnrollmentSlotStore implements WeightedEnrollmentSlotStore {
  items: Map<string, WeightedEnrollmentSlot>;
  order: string[];

  constructor(items: Map<string, WeightedEnrollmentSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedEnrollmentSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedEnrollmentSlot): void {
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

  list(): WeightedEnrollmentSlot[] {
    const out: WeightedEnrollmentSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedEnrollmentSlotStore(): WeightedEnrollmentSlotStore {
  return new MemoryWeightedEnrollmentSlotStore(new Map<string, WeightedEnrollmentSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedEnrollmentSlotStore implements WeightedEnrollmentSlotStore {
  inner: WeightedEnrollmentSlotStore;
  cache: cache.TtlCache<WeightedEnrollmentSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedEnrollmentSlotStore,
    cacheValue: cache.TtlCache<WeightedEnrollmentSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedEnrollmentSlot | undefined {
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

  save(item: WeightedEnrollmentSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedEnrollmentSlot[] {
    return this.inner.list();
  }
}

export function newCachedWeightedEnrollmentSlotStore(inner: WeightedEnrollmentSlotStore, ttl: number, clockValue: clock.Clock): WeightedEnrollmentSlotStore {
  return new CachedWeightedEnrollmentSlotStore(
    inner,
    cache.newTtlCache<WeightedEnrollmentSlot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted enrollment slots. Empty fields match all. */
export class WeightedEnrollmentSlotQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedEnrollmentSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedEnrollmentSlot[]): WeightedEnrollmentSlot[] {
    const matched = collections.filter(items, (candidate: WeightedEnrollmentSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedEnrollmentSlots(store: WeightedEnrollmentSlotStore, query: WeightedEnrollmentSlotQuery): WeightedEnrollmentSlot[] {
  return query.apply(store.list());
}

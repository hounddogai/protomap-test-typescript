import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencyAdjustment } from "./frequency-adjustment.js";

/** Keeps frequency adjustments by code. */
export interface FrequencyAdjustmentStore {
  find(code: string): FrequencyAdjustment | undefined;
  save(item: FrequencyAdjustment): void;
  remove(code: string): boolean;
  list(): FrequencyAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencyAdjustmentStore implements FrequencyAdjustmentStore {
  items: Map<string, FrequencyAdjustment>;
  order: string[];

  constructor(items: Map<string, FrequencyAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencyAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencyAdjustment): void {
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

  list(): FrequencyAdjustment[] {
    const out: FrequencyAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencyAdjustmentStore(): FrequencyAdjustmentStore {
  return new MemoryFrequencyAdjustmentStore(new Map<string, FrequencyAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencyAdjustmentStore implements FrequencyAdjustmentStore {
  inner: FrequencyAdjustmentStore;
  cache: cache.TtlCache<FrequencyAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencyAdjustmentStore,
    cacheValue: cache.TtlCache<FrequencyAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencyAdjustment | undefined {
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

  save(item: FrequencyAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencyAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedFrequencyAdjustmentStore(inner: FrequencyAdjustmentStore, ttl: number, clockValue: clock.Clock): FrequencyAdjustmentStore {
  return new CachedFrequencyAdjustmentStore(inner, cache.newTtlCache<FrequencyAdjustment>(64, ttl, clockValue), 0, 0);
}

/** Selects frequency adjustments. Empty fields match all. */
export class FrequencyAdjustmentQuery {
  unit: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minQuantity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencyAdjustment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencyAdjustment[]): FrequencyAdjustment[] {
    const matched = collections.filter(items, (candidate: FrequencyAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencyAdjustments(store: FrequencyAdjustmentStore, query: FrequencyAdjustmentQuery): FrequencyAdjustment[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionAdjustment } from "./conversion-adjustment.js";

/** Keeps conversion adjustments by code. */
export interface ConversionAdjustmentStore {
  find(code: string): ConversionAdjustment | undefined;
  save(item: ConversionAdjustment): void;
  remove(code: string): boolean;
  list(): ConversionAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionAdjustmentStore implements ConversionAdjustmentStore {
  items: Map<string, ConversionAdjustment>;
  order: string[];

  constructor(items: Map<string, ConversionAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionAdjustment): void {
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

  list(): ConversionAdjustment[] {
    const out: ConversionAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionAdjustmentStore(): ConversionAdjustmentStore {
  return new MemoryConversionAdjustmentStore(new Map<string, ConversionAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionAdjustmentStore implements ConversionAdjustmentStore {
  inner: ConversionAdjustmentStore;
  cache: cache.TtlCache<ConversionAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionAdjustmentStore,
    cacheValue: cache.TtlCache<ConversionAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionAdjustment | undefined {
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

  save(item: ConversionAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedConversionAdjustmentStore(inner: ConversionAdjustmentStore, ttl: number, clockValue: clock.Clock): ConversionAdjustmentStore {
  return new CachedConversionAdjustmentStore(inner, cache.newTtlCache<ConversionAdjustment>(64, ttl, clockValue), 0, 0);
}

/** Selects conversion adjustments. Empty fields match all. */
export class ConversionAdjustmentQuery {
  unit: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAmount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionAdjustment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionAdjustment[]): ConversionAdjustment[] {
    const matched = collections.filter(items, (candidate: ConversionAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionAdjustments(store: ConversionAdjustmentStore, query: ConversionAdjustmentQuery): ConversionAdjustment[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelAdjustment } from "./model-adjustment.js";

/** Keeps model adjustments by code. */
export interface ModelAdjustmentStore {
  find(code: string): ModelAdjustment | undefined;
  save(item: ModelAdjustment): void;
  remove(code: string): boolean;
  list(): ModelAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelAdjustmentStore implements ModelAdjustmentStore {
  items: Map<string, ModelAdjustment>;
  order: string[];

  constructor(items: Map<string, ModelAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelAdjustment): void {
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

  list(): ModelAdjustment[] {
    const out: ModelAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelAdjustmentStore(): ModelAdjustmentStore {
  return new MemoryModelAdjustmentStore(new Map<string, ModelAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelAdjustmentStore implements ModelAdjustmentStore {
  inner: ModelAdjustmentStore;
  cache: cache.TtlCache<ModelAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: ModelAdjustmentStore,
    cacheValue: cache.TtlCache<ModelAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelAdjustment | undefined {
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

  save(item: ModelAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedModelAdjustmentStore(inner: ModelAdjustmentStore, ttl: number, clockValue: clock.Clock): ModelAdjustmentStore {
  return new CachedModelAdjustmentStore(inner, cache.newTtlCache<ModelAdjustment>(1024, ttl, clockValue), 0, 0);
}

/** Selects model adjustments. Empty fields match all. */
export class ModelAdjustmentQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelAdjustment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelAdjustment[]): ModelAdjustment[] {
    const matched = collections.filter(items, (candidate: ModelAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelAdjustments(store: ModelAdjustmentStore, query: ModelAdjustmentQuery): ModelAdjustment[] {
  return query.apply(store.list());
}

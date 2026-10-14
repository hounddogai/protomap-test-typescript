import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelEstimate } from "./model-estimate.js";

/** Keeps model estimates by code. */
export interface ModelEstimateStore {
  find(code: string): ModelEstimate | undefined;
  save(item: ModelEstimate): void;
  remove(code: string): boolean;
  list(): ModelEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelEstimateStore implements ModelEstimateStore {
  items: Map<string, ModelEstimate>;
  order: string[];

  constructor(items: Map<string, ModelEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelEstimate): void {
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

  list(): ModelEstimate[] {
    const out: ModelEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelEstimateStore(): ModelEstimateStore {
  return new MemoryModelEstimateStore(new Map<string, ModelEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelEstimateStore implements ModelEstimateStore {
  inner: ModelEstimateStore;
  cache: cache.TtlCache<ModelEstimate>;
  hits: number;
  misses: number;

  constructor(inner: ModelEstimateStore, cacheValue: cache.TtlCache<ModelEstimate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelEstimate | undefined {
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

  save(item: ModelEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelEstimate[] {
    return this.inner.list();
  }
}

export function newCachedModelEstimateStore(inner: ModelEstimateStore, ttl: number, clockValue: clock.Clock): ModelEstimateStore {
  return new CachedModelEstimateStore(inner, cache.newTtlCache<ModelEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects model estimates. Empty fields match all. */
export class ModelEstimateQuery {
  category: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRatio: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelEstimate): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelEstimate[]): ModelEstimate[] {
    const matched = collections.filter(items, (candidate: ModelEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelEstimates(store: ModelEstimateStore, query: ModelEstimateQuery): ModelEstimate[] {
  return query.apply(store.list());
}

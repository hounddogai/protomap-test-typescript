import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelVariance } from "./model-variance.js";

/** Keeps model variances by code. */
export interface ModelVarianceStore {
  find(code: string): ModelVariance | undefined;
  save(item: ModelVariance): void;
  remove(code: string): boolean;
  list(): ModelVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelVarianceStore implements ModelVarianceStore {
  items: Map<string, ModelVariance>;
  order: string[];

  constructor(items: Map<string, ModelVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelVariance): void {
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

  list(): ModelVariance[] {
    const out: ModelVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelVarianceStore(): ModelVarianceStore {
  return new MemoryModelVarianceStore(new Map<string, ModelVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelVarianceStore implements ModelVarianceStore {
  inner: ModelVarianceStore;
  cache: cache.TtlCache<ModelVariance>;
  hits: number;
  misses: number;

  constructor(inner: ModelVarianceStore, cacheValue: cache.TtlCache<ModelVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelVariance | undefined {
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

  save(item: ModelVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelVariance[] {
    return this.inner.list();
  }
}

export function newCachedModelVarianceStore(inner: ModelVarianceStore, ttl: number, clockValue: clock.Clock): ModelVarianceStore {
  return new CachedModelVarianceStore(inner, cache.newTtlCache<ModelVariance>(1024, ttl, clockValue), 0, 0);
}

/** Selects model variances. Empty fields match all. */
export class ModelVarianceQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelVariance): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelVariance[]): ModelVariance[] {
    const matched = collections.filter(items, (candidate: ModelVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelVariances(store: ModelVarianceStore, query: ModelVarianceQuery): ModelVariance[] {
  return query.apply(store.list());
}

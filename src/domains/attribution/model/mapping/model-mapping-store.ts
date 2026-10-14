import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelMapping } from "./model-mapping.js";

/** Keeps model mappings by code. */
export interface ModelMappingStore {
  find(code: string): ModelMapping | undefined;
  save(item: ModelMapping): void;
  remove(code: string): boolean;
  list(): ModelMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelMappingStore implements ModelMappingStore {
  items: Map<string, ModelMapping>;
  order: string[];

  constructor(items: Map<string, ModelMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelMapping): void {
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

  list(): ModelMapping[] {
    const out: ModelMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelMappingStore(): ModelMappingStore {
  return new MemoryModelMappingStore(new Map<string, ModelMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelMappingStore implements ModelMappingStore {
  inner: ModelMappingStore;
  cache: cache.TtlCache<ModelMapping>;
  hits: number;
  misses: number;

  constructor(inner: ModelMappingStore, cacheValue: cache.TtlCache<ModelMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelMapping | undefined {
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

  save(item: ModelMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelMapping[] {
    return this.inner.list();
  }
}

export function newCachedModelMappingStore(inner: ModelMappingStore, ttl: number, clockValue: clock.Clock): ModelMappingStore {
  return new CachedModelMappingStore(inner, cache.newTtlCache<ModelMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects model mappings. Empty fields match all. */
export class ModelMappingQuery {
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

  matches(item: ModelMapping): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelMapping[]): ModelMapping[] {
    const matched = collections.filter(items, (candidate: ModelMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelMappings(store: ModelMappingStore, query: ModelMappingQuery): ModelMapping[] {
  return query.apply(store.list());
}

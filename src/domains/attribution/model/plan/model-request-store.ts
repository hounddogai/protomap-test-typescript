import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelRequest } from "./model-request.js";

/** Keeps model requests by code. */
export interface ModelRequestStore {
  find(code: string): ModelRequest | undefined;
  save(item: ModelRequest): void;
  remove(code: string): boolean;
  list(): ModelRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelRequestStore implements ModelRequestStore {
  items: Map<string, ModelRequest>;
  order: string[];

  constructor(items: Map<string, ModelRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelRequest): void {
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

  list(): ModelRequest[] {
    const out: ModelRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelRequestStore(): ModelRequestStore {
  return new MemoryModelRequestStore(new Map<string, ModelRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelRequestStore implements ModelRequestStore {
  inner: ModelRequestStore;
  cache: cache.TtlCache<ModelRequest>;
  hits: number;
  misses: number;

  constructor(inner: ModelRequestStore, cacheValue: cache.TtlCache<ModelRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelRequest | undefined {
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

  save(item: ModelRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelRequest[] {
    return this.inner.list();
  }
}

export function newCachedModelRequestStore(inner: ModelRequestStore, ttl: number, clockValue: clock.Clock): ModelRequestStore {
  return new CachedModelRequestStore(inner, cache.newTtlCache<ModelRequest>(512, ttl, clockValue), 0, 0);
}

/** Selects model requests. Empty fields match all. */
export class ModelRequestQuery {
  label: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minConversionRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelRequest[]): ModelRequest[] {
    const matched = collections.filter(items, (candidate: ModelRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelRequests(store: ModelRequestStore, query: ModelRequestQuery): ModelRequest[] {
  return query.apply(store.list());
}

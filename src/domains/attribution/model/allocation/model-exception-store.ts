import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelException } from "./model-exception.js";

/** Keeps model exceptions by code. */
export interface ModelExceptionStore {
  find(code: string): ModelException | undefined;
  save(item: ModelException): void;
  remove(code: string): boolean;
  list(): ModelException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelExceptionStore implements ModelExceptionStore {
  items: Map<string, ModelException>;
  order: string[];

  constructor(items: Map<string, ModelException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelException): void {
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

  list(): ModelException[] {
    const out: ModelException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelExceptionStore(): ModelExceptionStore {
  return new MemoryModelExceptionStore(new Map<string, ModelException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelExceptionStore implements ModelExceptionStore {
  inner: ModelExceptionStore;
  cache: cache.TtlCache<ModelException>;
  hits: number;
  misses: number;

  constructor(
    inner: ModelExceptionStore,
    cacheValue: cache.TtlCache<ModelException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelException | undefined {
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

  save(item: ModelException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelException[] {
    return this.inner.list();
  }
}

export function newCachedModelExceptionStore(inner: ModelExceptionStore, ttl: number, clockValue: clock.Clock): ModelExceptionStore {
  return new CachedModelExceptionStore(inner, cache.newTtlCache<ModelException>(1024, ttl, clockValue), 0, 0);
}

/** Selects model exceptions. Empty fields match all. */
export class ModelExceptionQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelException[]): ModelException[] {
    const matched = collections.filter(items, (candidate: ModelException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelExceptions(store: ModelExceptionStore, query: ModelExceptionQuery): ModelException[] {
  return query.apply(store.list());
}

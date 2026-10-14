import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelWindow } from "./model-window.js";

/** Keeps model windows by code. */
export interface ModelWindowStore {
  find(code: string): ModelWindow | undefined;
  save(item: ModelWindow): void;
  remove(code: string): boolean;
  list(): ModelWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelWindowStore implements ModelWindowStore {
  items: Map<string, ModelWindow>;
  order: string[];

  constructor(items: Map<string, ModelWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelWindow): void {
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

  list(): ModelWindow[] {
    const out: ModelWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelWindowStore(): ModelWindowStore {
  return new MemoryModelWindowStore(new Map<string, ModelWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelWindowStore implements ModelWindowStore {
  inner: ModelWindowStore;
  cache: cache.TtlCache<ModelWindow>;
  hits: number;
  misses: number;

  constructor(inner: ModelWindowStore, cacheValue: cache.TtlCache<ModelWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelWindow | undefined {
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

  save(item: ModelWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelWindow[] {
    return this.inner.list();
  }
}

export function newCachedModelWindowStore(inner: ModelWindowStore, ttl: number, clockValue: clock.Clock): ModelWindowStore {
  return new CachedModelWindowStore(inner, cache.newTtlCache<ModelWindow>(256, ttl, clockValue), 0, 0);
}

/** Selects model windows. Empty fields match all. */
export class ModelWindowQuery {
  category: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minQuantity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelWindow): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelWindow[]): ModelWindow[] {
    const matched = collections.filter(items, (candidate: ModelWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelWindows(store: ModelWindowStore, query: ModelWindowQuery): ModelWindow[] {
  return query.apply(store.list());
}

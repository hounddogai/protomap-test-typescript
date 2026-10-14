import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitBatch } from "./wait-batch.js";

/** Keeps wait batches by code. */
export interface WaitBatchStore {
  find(code: string): WaitBatch | undefined;
  save(item: WaitBatch): void;
  remove(code: string): boolean;
  list(): WaitBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitBatchStore implements WaitBatchStore {
  items: Map<string, WaitBatch>;
  order: string[];

  constructor(items: Map<string, WaitBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitBatch): void {
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

  list(): WaitBatch[] {
    const out: WaitBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitBatchStore(): WaitBatchStore {
  return new MemoryWaitBatchStore(new Map<string, WaitBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitBatchStore implements WaitBatchStore {
  inner: WaitBatchStore;
  cache: cache.TtlCache<WaitBatch>;
  hits: number;
  misses: number;

  constructor(inner: WaitBatchStore, cacheValue: cache.TtlCache<WaitBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitBatch | undefined {
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

  save(item: WaitBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitBatch[] {
    return this.inner.list();
  }
}

export function newCachedWaitBatchStore(inner: WaitBatchStore, ttl: number, clockValue: clock.Clock): WaitBatchStore {
  return new CachedWaitBatchStore(inner, cache.newTtlCache<WaitBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects wait batches. Empty fields match all. */
export class WaitBatchQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitBatch): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitBatch[]): WaitBatch[] {
    const matched = collections.filter(items, (candidate: WaitBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitBatches(store: WaitBatchStore, query: WaitBatchQuery): WaitBatch[] {
  return query.apply(store.list());
}

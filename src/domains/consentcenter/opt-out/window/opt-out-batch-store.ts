import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutBatch } from "./opt-out-batch.js";

/** Keeps opt out batches by code. */
export interface OptOutBatchStore {
  find(code: string): OptOutBatch | undefined;
  save(item: OptOutBatch): void;
  remove(code: string): boolean;
  list(): OptOutBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutBatchStore implements OptOutBatchStore {
  items: Map<string, OptOutBatch>;
  order: string[];

  constructor(items: Map<string, OptOutBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutBatch): void {
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

  list(): OptOutBatch[] {
    const out: OptOutBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutBatchStore(): OptOutBatchStore {
  return new MemoryOptOutBatchStore(new Map<string, OptOutBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutBatchStore implements OptOutBatchStore {
  inner: OptOutBatchStore;
  cache: cache.TtlCache<OptOutBatch>;
  hits: number;
  misses: number;

  constructor(inner: OptOutBatchStore, cacheValue: cache.TtlCache<OptOutBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutBatch | undefined {
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

  save(item: OptOutBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutBatch[] {
    return this.inner.list();
  }
}

export function newCachedOptOutBatchStore(inner: OptOutBatchStore, ttl: number, clockValue: clock.Clock): OptOutBatchStore {
  return new CachedOptOutBatchStore(inner, cache.newTtlCache<OptOutBatch>(64, ttl, clockValue), 0, 0);
}

/** Selects opt out batches. Empty fields match all. */
export class OptOutBatchQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutBatch): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutBatch[]): OptOutBatch[] {
    const matched = collections.filter(items, (candidate: OptOutBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutBatches(store: OptOutBatchStore, query: OptOutBatchQuery): OptOutBatch[] {
  return query.apply(store.list());
}

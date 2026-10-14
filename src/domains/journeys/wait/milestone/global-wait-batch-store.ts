import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalWaitBatch } from "./global-wait-batch.js";

/** Keeps global wait batches by code. */
export interface GlobalWaitBatchStore {
  find(code: string): GlobalWaitBatch | undefined;
  save(item: GlobalWaitBatch): void;
  remove(code: string): boolean;
  list(): GlobalWaitBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalWaitBatchStore implements GlobalWaitBatchStore {
  items: Map<string, GlobalWaitBatch>;
  order: string[];

  constructor(items: Map<string, GlobalWaitBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalWaitBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalWaitBatch): void {
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

  list(): GlobalWaitBatch[] {
    const out: GlobalWaitBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalWaitBatchStore(): GlobalWaitBatchStore {
  return new MemoryGlobalWaitBatchStore(new Map<string, GlobalWaitBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalWaitBatchStore implements GlobalWaitBatchStore {
  inner: GlobalWaitBatchStore;
  cache: cache.TtlCache<GlobalWaitBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalWaitBatchStore,
    cacheValue: cache.TtlCache<GlobalWaitBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalWaitBatch | undefined {
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

  save(item: GlobalWaitBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalWaitBatch[] {
    return this.inner.list();
  }
}

export function newCachedGlobalWaitBatchStore(inner: GlobalWaitBatchStore, ttl: number, clockValue: clock.Clock): GlobalWaitBatchStore {
  return new CachedGlobalWaitBatchStore(inner, cache.newTtlCache<GlobalWaitBatch>(1024, ttl, clockValue), 0, 0);
}

/** Selects global wait batches. Empty fields match all. */
export class GlobalWaitBatchQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalWaitBatch): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalWaitBatch[]): GlobalWaitBatch[] {
    const matched = collections.filter(items, (candidate: GlobalWaitBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalWaitBatches(store: GlobalWaitBatchStore, query: GlobalWaitBatchQuery): GlobalWaitBatch[] {
  return query.apply(store.list());
}

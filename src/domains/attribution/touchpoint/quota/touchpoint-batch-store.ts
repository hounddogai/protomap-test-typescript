import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointBatch } from "./touchpoint-batch.js";

/** Keeps touchpoint batches by code. */
export interface TouchpointBatchStore {
  find(code: string): TouchpointBatch | undefined;
  save(item: TouchpointBatch): void;
  remove(code: string): boolean;
  list(): TouchpointBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointBatchStore implements TouchpointBatchStore {
  items: Map<string, TouchpointBatch>;
  order: string[];

  constructor(items: Map<string, TouchpointBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointBatch): void {
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

  list(): TouchpointBatch[] {
    const out: TouchpointBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointBatchStore(): TouchpointBatchStore {
  return new MemoryTouchpointBatchStore(new Map<string, TouchpointBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointBatchStore implements TouchpointBatchStore {
  inner: TouchpointBatchStore;
  cache: cache.TtlCache<TouchpointBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointBatchStore,
    cacheValue: cache.TtlCache<TouchpointBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointBatch | undefined {
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

  save(item: TouchpointBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointBatch[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointBatchStore(inner: TouchpointBatchStore, ttl: number, clockValue: clock.Clock): TouchpointBatchStore {
  return new CachedTouchpointBatchStore(inner, cache.newTtlCache<TouchpointBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects touchpoint batches. Empty fields match all. */
export class TouchpointBatchQuery {
  category: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointBatch): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointBatch[]): TouchpointBatch[] {
    const matched = collections.filter(items, (candidate: TouchpointBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointBatches(store: TouchpointBatchStore, query: TouchpointBatchQuery): TouchpointBatch[] {
  return query.apply(store.list());
}

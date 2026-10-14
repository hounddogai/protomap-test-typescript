import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowBatch } from "./window-batch.js";

/** Keeps window batches by code. */
export interface WindowBatchStore {
  find(code: string): WindowBatch | undefined;
  save(item: WindowBatch): void;
  remove(code: string): boolean;
  list(): WindowBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowBatchStore implements WindowBatchStore {
  items: Map<string, WindowBatch>;
  order: string[];

  constructor(items: Map<string, WindowBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowBatch): void {
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

  list(): WindowBatch[] {
    const out: WindowBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowBatchStore(): WindowBatchStore {
  return new MemoryWindowBatchStore(new Map<string, WindowBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowBatchStore implements WindowBatchStore {
  inner: WindowBatchStore;
  cache: cache.TtlCache<WindowBatch>;
  hits: number;
  misses: number;

  constructor(inner: WindowBatchStore, cacheValue: cache.TtlCache<WindowBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowBatch | undefined {
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

  save(item: WindowBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowBatch[] {
    return this.inner.list();
  }
}

export function newCachedWindowBatchStore(inner: WindowBatchStore, ttl: number, clockValue: clock.Clock): WindowBatchStore {
  return new CachedWindowBatchStore(inner, cache.newTtlCache<WindowBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects window batches. Empty fields match all. */
export class WindowBatchQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowBatch[]): WindowBatch[] {
    const matched = collections.filter(items, (candidate: WindowBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowBatches(store: WindowBatchStore, query: WindowBatchQuery): WindowBatch[] {
  return query.apply(store.list());
}

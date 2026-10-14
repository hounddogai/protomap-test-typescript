import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedActivationWindow } from "./batched-activation-window.js";

/** Keeps batched activation windows by code. */
export interface BatchedActivationWindowStore {
  find(code: string): BatchedActivationWindow | undefined;
  save(item: BatchedActivationWindow): void;
  remove(code: string): boolean;
  list(): BatchedActivationWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedActivationWindowStore implements BatchedActivationWindowStore {
  items: Map<string, BatchedActivationWindow>;
  order: string[];

  constructor(items: Map<string, BatchedActivationWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedActivationWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedActivationWindow): void {
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

  list(): BatchedActivationWindow[] {
    const out: BatchedActivationWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedActivationWindowStore(): BatchedActivationWindowStore {
  return new MemoryBatchedActivationWindowStore(new Map<string, BatchedActivationWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedActivationWindowStore implements BatchedActivationWindowStore {
  inner: BatchedActivationWindowStore;
  cache: cache.TtlCache<BatchedActivationWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedActivationWindowStore,
    cacheValue: cache.TtlCache<BatchedActivationWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedActivationWindow | undefined {
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

  save(item: BatchedActivationWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedActivationWindow[] {
    return this.inner.list();
  }
}

export function newCachedBatchedActivationWindowStore(inner: BatchedActivationWindowStore, ttl: number, clockValue: clock.Clock): BatchedActivationWindowStore {
  return new CachedBatchedActivationWindowStore(
    inner,
    cache.newTtlCache<BatchedActivationWindow>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched activation windows. Empty fields match all. */
export class BatchedActivationWindowQuery {
  segment: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minClicks: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedActivationWindow): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedActivationWindow[]): BatchedActivationWindow[] {
    const matched = collections.filter(items, (candidate: BatchedActivationWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedActivationWindows(store: BatchedActivationWindowStore, query: BatchedActivationWindowQuery): BatchedActivationWindow[] {
  return query.apply(store.list());
}

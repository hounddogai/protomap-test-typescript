import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedOptOutBaseline } from "./batched-opt-out-baseline.js";

/** Keeps batched opt out baselines by code. */
export interface BatchedOptOutBaselineStore {
  find(code: string): BatchedOptOutBaseline | undefined;
  save(item: BatchedOptOutBaseline): void;
  remove(code: string): boolean;
  list(): BatchedOptOutBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedOptOutBaselineStore implements BatchedOptOutBaselineStore {
  items: Map<string, BatchedOptOutBaseline>;
  order: string[];

  constructor(items: Map<string, BatchedOptOutBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedOptOutBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedOptOutBaseline): void {
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

  list(): BatchedOptOutBaseline[] {
    const out: BatchedOptOutBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedOptOutBaselineStore(): BatchedOptOutBaselineStore {
  return new MemoryBatchedOptOutBaselineStore(new Map<string, BatchedOptOutBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedOptOutBaselineStore implements BatchedOptOutBaselineStore {
  inner: BatchedOptOutBaselineStore;
  cache: cache.TtlCache<BatchedOptOutBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedOptOutBaselineStore,
    cacheValue: cache.TtlCache<BatchedOptOutBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedOptOutBaseline | undefined {
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

  save(item: BatchedOptOutBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedOptOutBaseline[] {
    return this.inner.list();
  }
}

export function newCachedBatchedOptOutBaselineStore(inner: BatchedOptOutBaselineStore, ttl: number, clockValue: clock.Clock): BatchedOptOutBaselineStore {
  return new CachedBatchedOptOutBaselineStore(
    inner,
    cache.newTtlCache<BatchedOptOutBaseline>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched opt out baselines. Empty fields match all. */
export class BatchedOptOutBaselineQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedOptOutBaseline): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedOptOutBaseline[]): BatchedOptOutBaseline[] {
    const matched = collections.filter(items, (candidate: BatchedOptOutBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedOptOutBaselines(store: BatchedOptOutBaselineStore, query: BatchedOptOutBaselineQuery): BatchedOptOutBaseline[] {
  return query.apply(store.list());
}

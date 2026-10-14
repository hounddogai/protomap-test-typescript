import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPayoutBaseline } from "./batched-payout-baseline.js";

/** Keeps batched payout baselines by code. */
export interface BatchedPayoutBaselineStore {
  find(code: string): BatchedPayoutBaseline | undefined;
  save(item: BatchedPayoutBaseline): void;
  remove(code: string): boolean;
  list(): BatchedPayoutBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPayoutBaselineStore implements BatchedPayoutBaselineStore {
  items: Map<string, BatchedPayoutBaseline>;
  order: string[];

  constructor(items: Map<string, BatchedPayoutBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPayoutBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPayoutBaseline): void {
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

  list(): BatchedPayoutBaseline[] {
    const out: BatchedPayoutBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPayoutBaselineStore(): BatchedPayoutBaselineStore {
  return new MemoryBatchedPayoutBaselineStore(new Map<string, BatchedPayoutBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPayoutBaselineStore implements BatchedPayoutBaselineStore {
  inner: BatchedPayoutBaselineStore;
  cache: cache.TtlCache<BatchedPayoutBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPayoutBaselineStore,
    cacheValue: cache.TtlCache<BatchedPayoutBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPayoutBaseline | undefined {
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

  save(item: BatchedPayoutBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPayoutBaseline[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPayoutBaselineStore(inner: BatchedPayoutBaselineStore, ttl: number, clockValue: clock.Clock): BatchedPayoutBaselineStore {
  return new CachedBatchedPayoutBaselineStore(
    inner,
    cache.newTtlCache<BatchedPayoutBaseline>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched payout baselines. Empty fields match all. */
export class BatchedPayoutBaselineQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPayoutBaseline): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPayoutBaseline[]): BatchedPayoutBaseline[] {
    const matched = collections.filter(items, (candidate: BatchedPayoutBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPayoutBaselines(store: BatchedPayoutBaselineStore, query: BatchedPayoutBaselineQuery): BatchedPayoutBaseline[] {
  return query.apply(store.list());
}

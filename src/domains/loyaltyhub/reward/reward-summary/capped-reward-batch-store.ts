import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedRewardBatch } from "./capped-reward-batch.js";

/** Keeps capped reward batches by code. */
export interface CappedRewardBatchStore {
  find(code: string): CappedRewardBatch | undefined;
  save(item: CappedRewardBatch): void;
  remove(code: string): boolean;
  list(): CappedRewardBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedRewardBatchStore implements CappedRewardBatchStore {
  items: Map<string, CappedRewardBatch>;
  order: string[];

  constructor(items: Map<string, CappedRewardBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedRewardBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedRewardBatch): void {
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

  list(): CappedRewardBatch[] {
    const out: CappedRewardBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedRewardBatchStore(): CappedRewardBatchStore {
  return new MemoryCappedRewardBatchStore(new Map<string, CappedRewardBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedRewardBatchStore implements CappedRewardBatchStore {
  inner: CappedRewardBatchStore;
  cache: cache.TtlCache<CappedRewardBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedRewardBatchStore,
    cacheValue: cache.TtlCache<CappedRewardBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedRewardBatch | undefined {
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

  save(item: CappedRewardBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedRewardBatch[] {
    return this.inner.list();
  }
}

export function newCachedCappedRewardBatchStore(inner: CappedRewardBatchStore, ttl: number, clockValue: clock.Clock): CappedRewardBatchStore {
  return new CachedCappedRewardBatchStore(inner, cache.newTtlCache<CappedRewardBatch>(64, ttl, clockValue), 0, 0);
}

/** Selects capped reward batches. Empty fields match all. */
export class CappedRewardBatchQuery {
  unit: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAmount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedRewardBatch): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedRewardBatch[]): CappedRewardBatch[] {
    const matched = collections.filter(items, (candidate: CappedRewardBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedRewardBatches(store: CappedRewardBatchStore, query: CappedRewardBatchQuery): CappedRewardBatch[] {
  return query.apply(store.list());
}

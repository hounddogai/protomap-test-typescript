import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionBatch } from "./redemption-batch.js";

/** Keeps redemption batches by code. */
export interface RedemptionBatchStore {
  find(code: string): RedemptionBatch | undefined;
  save(item: RedemptionBatch): void;
  remove(code: string): boolean;
  list(): RedemptionBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionBatchStore implements RedemptionBatchStore {
  items: Map<string, RedemptionBatch>;
  order: string[];

  constructor(items: Map<string, RedemptionBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionBatch): void {
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

  list(): RedemptionBatch[] {
    const out: RedemptionBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionBatchStore(): RedemptionBatchStore {
  return new MemoryRedemptionBatchStore(new Map<string, RedemptionBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionBatchStore implements RedemptionBatchStore {
  inner: RedemptionBatchStore;
  cache: cache.TtlCache<RedemptionBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionBatchStore,
    cacheValue: cache.TtlCache<RedemptionBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionBatch | undefined {
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

  save(item: RedemptionBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionBatch[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionBatchStore(inner: RedemptionBatchStore, ttl: number, clockValue: clock.Clock): RedemptionBatchStore {
  return new CachedRedemptionBatchStore(inner, cache.newTtlCache<RedemptionBatch>(64, ttl, clockValue), 0, 0);
}

/** Selects redemption batches. Empty fields match all. */
export class RedemptionBatchQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionBatch): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionBatch[]): RedemptionBatch[] {
    const matched = collections.filter(items, (candidate: RedemptionBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionBatches(store: RedemptionBatchStore, query: RedemptionBatchQuery): RedemptionBatch[] {
  return query.apply(store.list());
}

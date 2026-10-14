import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRedemptionBatch } from "./tiered-redemption-batch.js";

/** Keeps tiered redemption batches by code. */
export interface TieredRedemptionBatchStore {
  find(code: string): TieredRedemptionBatch | undefined;
  save(item: TieredRedemptionBatch): void;
  remove(code: string): boolean;
  list(): TieredRedemptionBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRedemptionBatchStore implements TieredRedemptionBatchStore {
  items: Map<string, TieredRedemptionBatch>;
  order: string[];

  constructor(items: Map<string, TieredRedemptionBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRedemptionBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRedemptionBatch): void {
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

  list(): TieredRedemptionBatch[] {
    const out: TieredRedemptionBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRedemptionBatchStore(): TieredRedemptionBatchStore {
  return new MemoryTieredRedemptionBatchStore(new Map<string, TieredRedemptionBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRedemptionBatchStore implements TieredRedemptionBatchStore {
  inner: TieredRedemptionBatchStore;
  cache: cache.TtlCache<TieredRedemptionBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRedemptionBatchStore,
    cacheValue: cache.TtlCache<TieredRedemptionBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRedemptionBatch | undefined {
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

  save(item: TieredRedemptionBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRedemptionBatch[] {
    return this.inner.list();
  }
}

export function newCachedTieredRedemptionBatchStore(inner: TieredRedemptionBatchStore, ttl: number, clockValue: clock.Clock): TieredRedemptionBatchStore {
  return new CachedTieredRedemptionBatchStore(
    inner,
    cache.newTtlCache<TieredRedemptionBatch>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered redemption batches. Empty fields match all. */
export class TieredRedemptionBatchQuery {
  channel: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minEndsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRedemptionBatch): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRedemptionBatch[]): TieredRedemptionBatch[] {
    const matched = collections.filter(items, (candidate: TieredRedemptionBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRedemptionBatches(store: TieredRedemptionBatchStore, query: TieredRedemptionBatchQuery): TieredRedemptionBatch[] {
  return query.apply(store.list());
}

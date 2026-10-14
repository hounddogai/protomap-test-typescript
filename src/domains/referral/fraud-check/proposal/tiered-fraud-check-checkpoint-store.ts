import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFraudCheckCheckpoint } from "./tiered-fraud-check-checkpoint.js";

/** Keeps tiered fraud check checkpoints by code. */
export interface TieredFraudCheckCheckpointStore {
  find(code: string): TieredFraudCheckCheckpoint | undefined;
  save(item: TieredFraudCheckCheckpoint): void;
  remove(code: string): boolean;
  list(): TieredFraudCheckCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFraudCheckCheckpointStore implements TieredFraudCheckCheckpointStore {
  items: Map<string, TieredFraudCheckCheckpoint>;
  order: string[];

  constructor(items: Map<string, TieredFraudCheckCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFraudCheckCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFraudCheckCheckpoint): void {
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

  list(): TieredFraudCheckCheckpoint[] {
    const out: TieredFraudCheckCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFraudCheckCheckpointStore(): TieredFraudCheckCheckpointStore {
  return new MemoryTieredFraudCheckCheckpointStore(new Map<string, TieredFraudCheckCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFraudCheckCheckpointStore implements TieredFraudCheckCheckpointStore {
  inner: TieredFraudCheckCheckpointStore;
  cache: cache.TtlCache<TieredFraudCheckCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFraudCheckCheckpointStore,
    cacheValue: cache.TtlCache<TieredFraudCheckCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFraudCheckCheckpoint | undefined {
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

  save(item: TieredFraudCheckCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFraudCheckCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedTieredFraudCheckCheckpointStore(inner: TieredFraudCheckCheckpointStore, ttl: number, clockValue: clock.Clock): TieredFraudCheckCheckpointStore {
  return new CachedTieredFraudCheckCheckpointStore(
    inner,
    cache.newTtlCache<TieredFraudCheckCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered fraud check checkpoints. Empty fields match all. */
export class TieredFraudCheckCheckpointQuery {
  segment: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAmount: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFraudCheckCheckpoint): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFraudCheckCheckpoint[]): TieredFraudCheckCheckpoint[] {
    const matched = collections.filter(items, (candidate: TieredFraudCheckCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFraudCheckCheckpoints(store: TieredFraudCheckCheckpointStore, query: TieredFraudCheckCheckpointQuery): TieredFraudCheckCheckpoint[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutCheckpoint } from "./payout-checkpoint.js";

/** Keeps payout checkpoints by code. */
export interface PayoutCheckpointStore {
  find(code: string): PayoutCheckpoint | undefined;
  save(item: PayoutCheckpoint): void;
  remove(code: string): boolean;
  list(): PayoutCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutCheckpointStore implements PayoutCheckpointStore {
  items: Map<string, PayoutCheckpoint>;
  order: string[];

  constructor(items: Map<string, PayoutCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutCheckpoint): void {
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

  list(): PayoutCheckpoint[] {
    const out: PayoutCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutCheckpointStore(): PayoutCheckpointStore {
  return new MemoryPayoutCheckpointStore(new Map<string, PayoutCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutCheckpointStore implements PayoutCheckpointStore {
  inner: PayoutCheckpointStore;
  cache: cache.TtlCache<PayoutCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PayoutCheckpointStore,
    cacheValue: cache.TtlCache<PayoutCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutCheckpoint | undefined {
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

  save(item: PayoutCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPayoutCheckpointStore(inner: PayoutCheckpointStore, ttl: number, clockValue: clock.Clock): PayoutCheckpointStore {
  return new CachedPayoutCheckpointStore(inner, cache.newTtlCache<PayoutCheckpoint>(512, ttl, clockValue), 0, 0);
}

/** Selects payout checkpoints. Empty fields match all. */
export class PayoutCheckpointQuery {
  region: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCost: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutCheckpoint): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutCheckpoint[]): PayoutCheckpoint[] {
    const matched = collections.filter(items, (candidate: PayoutCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutCheckpoints(store: PayoutCheckpointStore, query: PayoutCheckpointQuery): PayoutCheckpoint[] {
  return query.apply(store.list());
}

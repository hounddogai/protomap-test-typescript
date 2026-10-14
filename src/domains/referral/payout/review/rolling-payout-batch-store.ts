import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPayoutBatch } from "./rolling-payout-batch.js";

/** Keeps rolling payout batches by code. */
export interface RollingPayoutBatchStore {
  find(code: string): RollingPayoutBatch | undefined;
  save(item: RollingPayoutBatch): void;
  remove(code: string): boolean;
  list(): RollingPayoutBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPayoutBatchStore implements RollingPayoutBatchStore {
  items: Map<string, RollingPayoutBatch>;
  order: string[];

  constructor(items: Map<string, RollingPayoutBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPayoutBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPayoutBatch): void {
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

  list(): RollingPayoutBatch[] {
    const out: RollingPayoutBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPayoutBatchStore(): RollingPayoutBatchStore {
  return new MemoryRollingPayoutBatchStore(new Map<string, RollingPayoutBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPayoutBatchStore implements RollingPayoutBatchStore {
  inner: RollingPayoutBatchStore;
  cache: cache.TtlCache<RollingPayoutBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPayoutBatchStore,
    cacheValue: cache.TtlCache<RollingPayoutBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPayoutBatch | undefined {
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

  save(item: RollingPayoutBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPayoutBatch[] {
    return this.inner.list();
  }
}

export function newCachedRollingPayoutBatchStore(inner: RollingPayoutBatchStore, ttl: number, clockValue: clock.Clock): RollingPayoutBatchStore {
  return new CachedRollingPayoutBatchStore(inner, cache.newTtlCache<RollingPayoutBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects rolling payout batches. Empty fields match all. */
export class RollingPayoutBatchQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPayoutBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPayoutBatch[]): RollingPayoutBatch[] {
    const matched = collections.filter(items, (candidate: RollingPayoutBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPayoutBatches(store: RollingPayoutBatchStore, query: RollingPayoutBatchQuery): RollingPayoutBatch[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredApprovalBatch } from "./tiered-approval-batch.js";

/** Keeps tiered approval batches by code. */
export interface TieredApprovalBatchStore {
  find(code: string): TieredApprovalBatch | undefined;
  save(item: TieredApprovalBatch): void;
  remove(code: string): boolean;
  list(): TieredApprovalBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredApprovalBatchStore implements TieredApprovalBatchStore {
  items: Map<string, TieredApprovalBatch>;
  order: string[];

  constructor(items: Map<string, TieredApprovalBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredApprovalBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredApprovalBatch): void {
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

  list(): TieredApprovalBatch[] {
    const out: TieredApprovalBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredApprovalBatchStore(): TieredApprovalBatchStore {
  return new MemoryTieredApprovalBatchStore(new Map<string, TieredApprovalBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredApprovalBatchStore implements TieredApprovalBatchStore {
  inner: TieredApprovalBatchStore;
  cache: cache.TtlCache<TieredApprovalBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredApprovalBatchStore,
    cacheValue: cache.TtlCache<TieredApprovalBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredApprovalBatch | undefined {
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

  save(item: TieredApprovalBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredApprovalBatch[] {
    return this.inner.list();
  }
}

export function newCachedTieredApprovalBatchStore(inner: TieredApprovalBatchStore, ttl: number, clockValue: clock.Clock): TieredApprovalBatchStore {
  return new CachedTieredApprovalBatchStore(inner, cache.newTtlCache<TieredApprovalBatch>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered approval batches. Empty fields match all. */
export class TieredApprovalBatchQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredApprovalBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredApprovalBatch[]): TieredApprovalBatch[] {
    const matched = collections.filter(items, (candidate: TieredApprovalBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredApprovalBatches(store: TieredApprovalBatchStore, query: TieredApprovalBatchQuery): TieredApprovalBatch[] {
  return query.apply(store.list());
}

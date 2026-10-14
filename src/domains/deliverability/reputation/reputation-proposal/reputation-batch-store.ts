import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationBatch } from "./reputation-batch.js";

/** Keeps reputation batches by code. */
export interface ReputationBatchStore {
  find(code: string): ReputationBatch | undefined;
  save(item: ReputationBatch): void;
  remove(code: string): boolean;
  list(): ReputationBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationBatchStore implements ReputationBatchStore {
  items: Map<string, ReputationBatch>;
  order: string[];

  constructor(items: Map<string, ReputationBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationBatch): void {
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

  list(): ReputationBatch[] {
    const out: ReputationBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationBatchStore(): ReputationBatchStore {
  return new MemoryReputationBatchStore(new Map<string, ReputationBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationBatchStore implements ReputationBatchStore {
  inner: ReputationBatchStore;
  cache: cache.TtlCache<ReputationBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationBatchStore,
    cacheValue: cache.TtlCache<ReputationBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationBatch | undefined {
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

  save(item: ReputationBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationBatch[] {
    return this.inner.list();
  }
}

export function newCachedReputationBatchStore(inner: ReputationBatchStore, ttl: number, clockValue: clock.Clock): ReputationBatchStore {
  return new CachedReputationBatchStore(inner, cache.newTtlCache<ReputationBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects reputation batches. Empty fields match all. */
export class ReputationBatchQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationBatch[]): ReputationBatch[] {
    const matched = collections.filter(items, (candidate: ReputationBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationBatches(store: ReputationBatchStore, query: ReputationBatchQuery): ReputationBatch[] {
  return query.apply(store.list());
}

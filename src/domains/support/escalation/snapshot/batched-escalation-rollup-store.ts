import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedEscalationRollup } from "./batched-escalation-rollup.js";

/** Keeps batched escalation rollups by code. */
export interface BatchedEscalationRollupStore {
  find(code: string): BatchedEscalationRollup | undefined;
  save(item: BatchedEscalationRollup): void;
  remove(code: string): boolean;
  list(): BatchedEscalationRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedEscalationRollupStore implements BatchedEscalationRollupStore {
  items: Map<string, BatchedEscalationRollup>;
  order: string[];

  constructor(items: Map<string, BatchedEscalationRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedEscalationRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedEscalationRollup): void {
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

  list(): BatchedEscalationRollup[] {
    const out: BatchedEscalationRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedEscalationRollupStore(): BatchedEscalationRollupStore {
  return new MemoryBatchedEscalationRollupStore(new Map<string, BatchedEscalationRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedEscalationRollupStore implements BatchedEscalationRollupStore {
  inner: BatchedEscalationRollupStore;
  cache: cache.TtlCache<BatchedEscalationRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedEscalationRollupStore,
    cacheValue: cache.TtlCache<BatchedEscalationRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedEscalationRollup | undefined {
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

  save(item: BatchedEscalationRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedEscalationRollup[] {
    return this.inner.list();
  }
}

export function newCachedBatchedEscalationRollupStore(inner: BatchedEscalationRollupStore, ttl: number, clockValue: clock.Clock): BatchedEscalationRollupStore {
  return new CachedBatchedEscalationRollupStore(
    inner,
    cache.newTtlCache<BatchedEscalationRollup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched escalation rollups. Empty fields match all. */
export class BatchedEscalationRollupQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedEscalationRollup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedEscalationRollup[]): BatchedEscalationRollup[] {
    const matched = collections.filter(items, (candidate: BatchedEscalationRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedEscalationRollups(store: BatchedEscalationRollupStore, query: BatchedEscalationRollupQuery): BatchedEscalationRollup[] {
  return query.apply(store.list());
}

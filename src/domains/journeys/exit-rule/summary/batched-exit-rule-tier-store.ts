import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedExitRuleTier } from "./batched-exit-rule-tier.js";

/** Keeps batched exit rule tiers by code. */
export interface BatchedExitRuleTierStore {
  find(code: string): BatchedExitRuleTier | undefined;
  save(item: BatchedExitRuleTier): void;
  remove(code: string): boolean;
  list(): BatchedExitRuleTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedExitRuleTierStore implements BatchedExitRuleTierStore {
  items: Map<string, BatchedExitRuleTier>;
  order: string[];

  constructor(items: Map<string, BatchedExitRuleTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedExitRuleTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedExitRuleTier): void {
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

  list(): BatchedExitRuleTier[] {
    const out: BatchedExitRuleTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedExitRuleTierStore(): BatchedExitRuleTierStore {
  return new MemoryBatchedExitRuleTierStore(new Map<string, BatchedExitRuleTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedExitRuleTierStore implements BatchedExitRuleTierStore {
  inner: BatchedExitRuleTierStore;
  cache: cache.TtlCache<BatchedExitRuleTier>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedExitRuleTierStore,
    cacheValue: cache.TtlCache<BatchedExitRuleTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedExitRuleTier | undefined {
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

  save(item: BatchedExitRuleTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedExitRuleTier[] {
    return this.inner.list();
  }
}

export function newCachedBatchedExitRuleTierStore(inner: BatchedExitRuleTierStore, ttl: number, clockValue: clock.Clock): BatchedExitRuleTierStore {
  return new CachedBatchedExitRuleTierStore(inner, cache.newTtlCache<BatchedExitRuleTier>(256, ttl, clockValue), 0, 0);
}

/** Selects batched exit rule tiers. Empty fields match all. */
export class BatchedExitRuleTierQuery {
  name: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minQuantity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedExitRuleTier): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedExitRuleTier[]): BatchedExitRuleTier[] {
    const matched = collections.filter(items, (candidate: BatchedExitRuleTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedExitRuleTiers(store: BatchedExitRuleTierStore, query: BatchedExitRuleTierQuery): BatchedExitRuleTier[] {
  return query.apply(store.list());
}

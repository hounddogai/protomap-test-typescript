import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPacingPolicy } from "./batched-pacing-policy.js";

/** Keeps batched pacing policies by code. */
export interface BatchedPacingPolicyStore {
  find(code: string): BatchedPacingPolicy | undefined;
  save(item: BatchedPacingPolicy): void;
  remove(code: string): boolean;
  list(): BatchedPacingPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPacingPolicyStore implements BatchedPacingPolicyStore {
  items: Map<string, BatchedPacingPolicy>;
  order: string[];

  constructor(items: Map<string, BatchedPacingPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPacingPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPacingPolicy): void {
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

  list(): BatchedPacingPolicy[] {
    const out: BatchedPacingPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPacingPolicyStore(): BatchedPacingPolicyStore {
  return new MemoryBatchedPacingPolicyStore(new Map<string, BatchedPacingPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPacingPolicyStore implements BatchedPacingPolicyStore {
  inner: BatchedPacingPolicyStore;
  cache: cache.TtlCache<BatchedPacingPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPacingPolicyStore,
    cacheValue: cache.TtlCache<BatchedPacingPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPacingPolicy | undefined {
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

  save(item: BatchedPacingPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPacingPolicy[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPacingPolicyStore(inner: BatchedPacingPolicyStore, ttl: number, clockValue: clock.Clock): BatchedPacingPolicyStore {
  return new CachedBatchedPacingPolicyStore(inner, cache.newTtlCache<BatchedPacingPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects batched pacing policies. Empty fields match all. */
export class BatchedPacingPolicyQuery {
  unit: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minGraceDays: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPacingPolicy): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPacingPolicy[]): BatchedPacingPolicy[] {
    const matched = collections.filter(items, (candidate: BatchedPacingPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPacingPolicies(store: BatchedPacingPolicyStore, query: BatchedPacingPolicyQuery): BatchedPacingPolicy[] {
  return query.apply(store.list());
}

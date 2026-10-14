import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedWaitPolicy } from "./batched-wait-policy.js";

/** Keeps batched wait policies by code. */
export interface BatchedWaitPolicyStore {
  find(code: string): BatchedWaitPolicy | undefined;
  save(item: BatchedWaitPolicy): void;
  remove(code: string): boolean;
  list(): BatchedWaitPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedWaitPolicyStore implements BatchedWaitPolicyStore {
  items: Map<string, BatchedWaitPolicy>;
  order: string[];

  constructor(items: Map<string, BatchedWaitPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedWaitPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedWaitPolicy): void {
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

  list(): BatchedWaitPolicy[] {
    const out: BatchedWaitPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedWaitPolicyStore(): BatchedWaitPolicyStore {
  return new MemoryBatchedWaitPolicyStore(new Map<string, BatchedWaitPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedWaitPolicyStore implements BatchedWaitPolicyStore {
  inner: BatchedWaitPolicyStore;
  cache: cache.TtlCache<BatchedWaitPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedWaitPolicyStore,
    cacheValue: cache.TtlCache<BatchedWaitPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedWaitPolicy | undefined {
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

  save(item: BatchedWaitPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedWaitPolicy[] {
    return this.inner.list();
  }
}

export function newCachedBatchedWaitPolicyStore(inner: BatchedWaitPolicyStore, ttl: number, clockValue: clock.Clock): BatchedWaitPolicyStore {
  return new CachedBatchedWaitPolicyStore(inner, cache.newTtlCache<BatchedWaitPolicy>(1024, ttl, clockValue), 0, 0);
}

/** Selects batched wait policies. Empty fields match all. */
export class BatchedWaitPolicyQuery {
  utmSource: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minThreshold: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedWaitPolicy): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedWaitPolicy[]): BatchedWaitPolicy[] {
    const matched = collections.filter(items, (candidate: BatchedWaitPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedWaitPolicies(store: BatchedWaitPolicyStore, query: BatchedWaitPolicyQuery): BatchedWaitPolicy[] {
  return query.apply(store.list());
}

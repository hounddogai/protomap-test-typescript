import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedJourneyPolicy } from "./batched-journey-policy.js";

/** Keeps batched journey policies by code. */
export interface BatchedJourneyPolicyStore {
  find(code: string): BatchedJourneyPolicy | undefined;
  save(item: BatchedJourneyPolicy): void;
  remove(code: string): boolean;
  list(): BatchedJourneyPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedJourneyPolicyStore implements BatchedJourneyPolicyStore {
  items: Map<string, BatchedJourneyPolicy>;
  order: string[];

  constructor(items: Map<string, BatchedJourneyPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedJourneyPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedJourneyPolicy): void {
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

  list(): BatchedJourneyPolicy[] {
    const out: BatchedJourneyPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedJourneyPolicyStore(): BatchedJourneyPolicyStore {
  return new MemoryBatchedJourneyPolicyStore(new Map<string, BatchedJourneyPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedJourneyPolicyStore implements BatchedJourneyPolicyStore {
  inner: BatchedJourneyPolicyStore;
  cache: cache.TtlCache<BatchedJourneyPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedJourneyPolicyStore,
    cacheValue: cache.TtlCache<BatchedJourneyPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedJourneyPolicy | undefined {
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

  save(item: BatchedJourneyPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedJourneyPolicy[] {
    return this.inner.list();
  }
}

export function newCachedBatchedJourneyPolicyStore(inner: BatchedJourneyPolicyStore, ttl: number, clockValue: clock.Clock): BatchedJourneyPolicyStore {
  return new CachedBatchedJourneyPolicyStore(
    inner,
    cache.newTtlCache<BatchedJourneyPolicy>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched journey policies. Empty fields match all. */
export class BatchedJourneyPolicyQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedJourneyPolicy): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedJourneyPolicy[]): BatchedJourneyPolicy[] {
    const matched = collections.filter(items, (candidate: BatchedJourneyPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedJourneyPolicies(store: BatchedJourneyPolicyStore, query: BatchedJourneyPolicyQuery): BatchedJourneyPolicy[] {
  return query.apply(store.list());
}

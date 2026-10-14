import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPreferenceRequest } from "./batched-preference-request.js";

/** Keeps batched preference requests by code. */
export interface BatchedPreferenceRequestStore {
  find(code: string): BatchedPreferenceRequest | undefined;
  save(item: BatchedPreferenceRequest): void;
  remove(code: string): boolean;
  list(): BatchedPreferenceRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPreferenceRequestStore implements BatchedPreferenceRequestStore {
  items: Map<string, BatchedPreferenceRequest>;
  order: string[];

  constructor(items: Map<string, BatchedPreferenceRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPreferenceRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPreferenceRequest): void {
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

  list(): BatchedPreferenceRequest[] {
    const out: BatchedPreferenceRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPreferenceRequestStore(): BatchedPreferenceRequestStore {
  return new MemoryBatchedPreferenceRequestStore(new Map<string, BatchedPreferenceRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPreferenceRequestStore implements BatchedPreferenceRequestStore {
  inner: BatchedPreferenceRequestStore;
  cache: cache.TtlCache<BatchedPreferenceRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPreferenceRequestStore,
    cacheValue: cache.TtlCache<BatchedPreferenceRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPreferenceRequest | undefined {
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

  save(item: BatchedPreferenceRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPreferenceRequest[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPreferenceRequestStore(inner: BatchedPreferenceRequestStore, ttl: number, clockValue: clock.Clock): BatchedPreferenceRequestStore {
  return new CachedBatchedPreferenceRequestStore(
    inner,
    cache.newTtlCache<BatchedPreferenceRequest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched preference requests. Empty fields match all. */
export class BatchedPreferenceRequestQuery {
  locale: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMinimum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPreferenceRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPreferenceRequest[]): BatchedPreferenceRequest[] {
    const matched = collections.filter(items, (candidate: BatchedPreferenceRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPreferenceRequests(store: BatchedPreferenceRequestStore, query: BatchedPreferenceRequestQuery): BatchedPreferenceRequest[] {
  return query.apply(store.list());
}

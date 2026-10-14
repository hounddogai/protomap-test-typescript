import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedWaitPreference } from "./batched-wait-preference.js";

/** Keeps batched wait preferences by code. */
export interface BatchedWaitPreferenceStore {
  find(code: string): BatchedWaitPreference | undefined;
  save(item: BatchedWaitPreference): void;
  remove(code: string): boolean;
  list(): BatchedWaitPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedWaitPreferenceStore implements BatchedWaitPreferenceStore {
  items: Map<string, BatchedWaitPreference>;
  order: string[];

  constructor(items: Map<string, BatchedWaitPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedWaitPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedWaitPreference): void {
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

  list(): BatchedWaitPreference[] {
    const out: BatchedWaitPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedWaitPreferenceStore(): BatchedWaitPreferenceStore {
  return new MemoryBatchedWaitPreferenceStore(new Map<string, BatchedWaitPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedWaitPreferenceStore implements BatchedWaitPreferenceStore {
  inner: BatchedWaitPreferenceStore;
  cache: cache.TtlCache<BatchedWaitPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedWaitPreferenceStore,
    cacheValue: cache.TtlCache<BatchedWaitPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedWaitPreference | undefined {
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

  save(item: BatchedWaitPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedWaitPreference[] {
    return this.inner.list();
  }
}

export function newCachedBatchedWaitPreferenceStore(inner: BatchedWaitPreferenceStore, ttl: number, clockValue: clock.Clock): BatchedWaitPreferenceStore {
  return new CachedBatchedWaitPreferenceStore(
    inner,
    cache.newTtlCache<BatchedWaitPreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched wait preferences. Empty fields match all. */
export class BatchedWaitPreferenceQuery {
  country: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCeiling: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedWaitPreference): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedWaitPreference[]): BatchedWaitPreference[] {
    const matched = collections.filter(items, (candidate: BatchedWaitPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedWaitPreferences(store: BatchedWaitPreferenceStore, query: BatchedWaitPreferenceQuery): BatchedWaitPreference[] {
  return query.apply(store.list());
}

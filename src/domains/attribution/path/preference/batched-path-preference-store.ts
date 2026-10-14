import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPathPreference } from "./batched-path-preference.js";

/** Keeps batched path preferences by code. */
export interface BatchedPathPreferenceStore {
  find(code: string): BatchedPathPreference | undefined;
  save(item: BatchedPathPreference): void;
  remove(code: string): boolean;
  list(): BatchedPathPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPathPreferenceStore implements BatchedPathPreferenceStore {
  items: Map<string, BatchedPathPreference>;
  order: string[];

  constructor(items: Map<string, BatchedPathPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPathPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPathPreference): void {
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

  list(): BatchedPathPreference[] {
    const out: BatchedPathPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPathPreferenceStore(): BatchedPathPreferenceStore {
  return new MemoryBatchedPathPreferenceStore(new Map<string, BatchedPathPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPathPreferenceStore implements BatchedPathPreferenceStore {
  inner: BatchedPathPreferenceStore;
  cache: cache.TtlCache<BatchedPathPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPathPreferenceStore,
    cacheValue: cache.TtlCache<BatchedPathPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPathPreference | undefined {
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

  save(item: BatchedPathPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPathPreference[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPathPreferenceStore(inner: BatchedPathPreferenceStore, ttl: number, clockValue: clock.Clock): BatchedPathPreferenceStore {
  return new CachedBatchedPathPreferenceStore(
    inner,
    cache.newTtlCache<BatchedPathPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched path preferences. Empty fields match all. */
export class BatchedPathPreferenceQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPathPreference): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPathPreference[]): BatchedPathPreference[] {
    const matched = collections.filter(items, (candidate: BatchedPathPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPathPreferences(store: BatchedPathPreferenceStore, query: BatchedPathPreferenceQuery): BatchedPathPreference[] {
  return query.apply(store.list());
}

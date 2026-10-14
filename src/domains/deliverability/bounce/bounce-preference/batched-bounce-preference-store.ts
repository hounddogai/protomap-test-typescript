import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedBouncePreference } from "./batched-bounce-preference.js";

/** Keeps batched bounce preferences by code. */
export interface BatchedBouncePreferenceStore {
  find(code: string): BatchedBouncePreference | undefined;
  save(item: BatchedBouncePreference): void;
  remove(code: string): boolean;
  list(): BatchedBouncePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedBouncePreferenceStore implements BatchedBouncePreferenceStore {
  items: Map<string, BatchedBouncePreference>;
  order: string[];

  constructor(items: Map<string, BatchedBouncePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedBouncePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedBouncePreference): void {
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

  list(): BatchedBouncePreference[] {
    const out: BatchedBouncePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedBouncePreferenceStore(): BatchedBouncePreferenceStore {
  return new MemoryBatchedBouncePreferenceStore(new Map<string, BatchedBouncePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedBouncePreferenceStore implements BatchedBouncePreferenceStore {
  inner: BatchedBouncePreferenceStore;
  cache: cache.TtlCache<BatchedBouncePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedBouncePreferenceStore,
    cacheValue: cache.TtlCache<BatchedBouncePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedBouncePreference | undefined {
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

  save(item: BatchedBouncePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedBouncePreference[] {
    return this.inner.list();
  }
}

export function newCachedBatchedBouncePreferenceStore(inner: BatchedBouncePreferenceStore, ttl: number, clockValue: clock.Clock): BatchedBouncePreferenceStore {
  return new CachedBatchedBouncePreferenceStore(
    inner,
    cache.newTtlCache<BatchedBouncePreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched bounce preferences. Empty fields match all. */
export class BatchedBouncePreferenceQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedBouncePreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedBouncePreference[]): BatchedBouncePreference[] {
    const matched = collections.filter(items, (candidate: BatchedBouncePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedBouncePreferences(store: BatchedBouncePreferenceStore, query: BatchedBouncePreferenceQuery): BatchedBouncePreference[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

/** Keeps batched touchpoint preferences by code. */
export interface BatchedTouchpointPreferenceStore {
  find(code: string): BatchedTouchpointPreference | undefined;
  save(item: BatchedTouchpointPreference): void;
  remove(code: string): boolean;
  list(): BatchedTouchpointPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedTouchpointPreferenceStore implements BatchedTouchpointPreferenceStore {
  items: Map<string, BatchedTouchpointPreference>;
  order: string[];

  constructor(items: Map<string, BatchedTouchpointPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedTouchpointPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedTouchpointPreference): void {
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

  list(): BatchedTouchpointPreference[] {
    const out: BatchedTouchpointPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedTouchpointPreferenceStore(): BatchedTouchpointPreferenceStore {
  return new MemoryBatchedTouchpointPreferenceStore(new Map<string, BatchedTouchpointPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedTouchpointPreferenceStore implements BatchedTouchpointPreferenceStore {
  inner: BatchedTouchpointPreferenceStore;
  cache: cache.TtlCache<BatchedTouchpointPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedTouchpointPreferenceStore,
    cacheValue: cache.TtlCache<BatchedTouchpointPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedTouchpointPreference | undefined {
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

  save(item: BatchedTouchpointPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedTouchpointPreference[] {
    return this.inner.list();
  }
}

export function newCachedBatchedTouchpointPreferenceStore(inner: BatchedTouchpointPreferenceStore, ttl: number, clockValue: clock.Clock): BatchedTouchpointPreferenceStore {
  return new CachedBatchedTouchpointPreferenceStore(
    inner,
    cache.newTtlCache<BatchedTouchpointPreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched touchpoint preferences. Empty fields match all. */
export class BatchedTouchpointPreferenceQuery {
  label: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minStartsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedTouchpointPreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedTouchpointPreference[]): BatchedTouchpointPreference[] {
    const matched = collections.filter(items, (candidate: BatchedTouchpointPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedTouchpointPreferences(store: BatchedTouchpointPreferenceStore, query: BatchedTouchpointPreferenceQuery): BatchedTouchpointPreference[] {
  return query.apply(store.list());
}

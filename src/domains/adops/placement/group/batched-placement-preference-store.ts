import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPlacementPreference } from "./batched-placement-preference.js";

/** Keeps batched placement preferences by code. */
export interface BatchedPlacementPreferenceStore {
  find(code: string): BatchedPlacementPreference | undefined;
  save(item: BatchedPlacementPreference): void;
  remove(code: string): boolean;
  list(): BatchedPlacementPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPlacementPreferenceStore implements BatchedPlacementPreferenceStore {
  items: Map<string, BatchedPlacementPreference>;
  order: string[];

  constructor(items: Map<string, BatchedPlacementPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPlacementPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPlacementPreference): void {
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

  list(): BatchedPlacementPreference[] {
    const out: BatchedPlacementPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPlacementPreferenceStore(): BatchedPlacementPreferenceStore {
  return new MemoryBatchedPlacementPreferenceStore(new Map<string, BatchedPlacementPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPlacementPreferenceStore implements BatchedPlacementPreferenceStore {
  inner: BatchedPlacementPreferenceStore;
  cache: cache.TtlCache<BatchedPlacementPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPlacementPreferenceStore,
    cacheValue: cache.TtlCache<BatchedPlacementPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPlacementPreference | undefined {
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

  save(item: BatchedPlacementPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPlacementPreference[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPlacementPreferenceStore(inner: BatchedPlacementPreferenceStore, ttl: number, clockValue: clock.Clock): BatchedPlacementPreferenceStore {
  return new CachedBatchedPlacementPreferenceStore(
    inner,
    cache.newTtlCache<BatchedPlacementPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched placement preferences. Empty fields match all. */
export class BatchedPlacementPreferenceQuery {
  segment: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minOpenRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPlacementPreference): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPlacementPreference[]): BatchedPlacementPreference[] {
    const matched = collections.filter(items, (candidate: BatchedPlacementPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPlacementPreferences(store: BatchedPlacementPreferenceStore, query: BatchedPlacementPreferenceQuery): BatchedPlacementPreference[] {
  return query.apply(store.list());
}

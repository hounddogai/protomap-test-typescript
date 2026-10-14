import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPlacementGroup } from "./batched-placement-group.js";

/** Keeps batched placement groups by code. */
export interface BatchedPlacementGroupStore {
  find(code: string): BatchedPlacementGroup | undefined;
  save(item: BatchedPlacementGroup): void;
  remove(code: string): boolean;
  list(): BatchedPlacementGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPlacementGroupStore implements BatchedPlacementGroupStore {
  items: Map<string, BatchedPlacementGroup>;
  order: string[];

  constructor(items: Map<string, BatchedPlacementGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPlacementGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPlacementGroup): void {
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

  list(): BatchedPlacementGroup[] {
    const out: BatchedPlacementGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPlacementGroupStore(): BatchedPlacementGroupStore {
  return new MemoryBatchedPlacementGroupStore(new Map<string, BatchedPlacementGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPlacementGroupStore implements BatchedPlacementGroupStore {
  inner: BatchedPlacementGroupStore;
  cache: cache.TtlCache<BatchedPlacementGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPlacementGroupStore,
    cacheValue: cache.TtlCache<BatchedPlacementGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPlacementGroup | undefined {
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

  save(item: BatchedPlacementGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPlacementGroup[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPlacementGroupStore(inner: BatchedPlacementGroupStore, ttl: number, clockValue: clock.Clock): BatchedPlacementGroupStore {
  return new CachedBatchedPlacementGroupStore(
    inner,
    cache.newTtlCache<BatchedPlacementGroup>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched placement groups. Empty fields match all. */
export class BatchedPlacementGroupQuery {
  locale: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minVersion: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPlacementGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPlacementGroup[]): BatchedPlacementGroup[] {
    const matched = collections.filter(items, (candidate: BatchedPlacementGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPlacementGroups(store: BatchedPlacementGroupStore, query: BatchedPlacementGroupQuery): BatchedPlacementGroup[] {
  return query.apply(store.list());
}

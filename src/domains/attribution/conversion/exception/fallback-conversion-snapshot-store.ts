import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackConversionSnapshot } from "./fallback-conversion-snapshot.js";

/** Keeps fallback conversion snapshots by code. */
export interface FallbackConversionSnapshotStore {
  find(code: string): FallbackConversionSnapshot | undefined;
  save(item: FallbackConversionSnapshot): void;
  remove(code: string): boolean;
  list(): FallbackConversionSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackConversionSnapshotStore implements FallbackConversionSnapshotStore {
  items: Map<string, FallbackConversionSnapshot>;
  order: string[];

  constructor(items: Map<string, FallbackConversionSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackConversionSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackConversionSnapshot): void {
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

  list(): FallbackConversionSnapshot[] {
    const out: FallbackConversionSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackConversionSnapshotStore(): FallbackConversionSnapshotStore {
  return new MemoryFallbackConversionSnapshotStore(new Map<string, FallbackConversionSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackConversionSnapshotStore implements FallbackConversionSnapshotStore {
  inner: FallbackConversionSnapshotStore;
  cache: cache.TtlCache<FallbackConversionSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackConversionSnapshotStore,
    cacheValue: cache.TtlCache<FallbackConversionSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackConversionSnapshot | undefined {
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

  save(item: FallbackConversionSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackConversionSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedFallbackConversionSnapshotStore(inner: FallbackConversionSnapshotStore, ttl: number, clockValue: clock.Clock): FallbackConversionSnapshotStore {
  return new CachedFallbackConversionSnapshotStore(
    inner,
    cache.newTtlCache<FallbackConversionSnapshot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback conversion snapshots. Empty fields match all. */
export class FallbackConversionSnapshotQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackConversionSnapshot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackConversionSnapshot[]): FallbackConversionSnapshot[] {
    const matched = collections.filter(items, (candidate: FallbackConversionSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackConversionSnapshots(store: FallbackConversionSnapshotStore, query: FallbackConversionSnapshotQuery): FallbackConversionSnapshot[] {
  return query.apply(store.list());
}

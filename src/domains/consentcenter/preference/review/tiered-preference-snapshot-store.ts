import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPreferenceSnapshot } from "./tiered-preference-snapshot.js";

/** Keeps tiered preference snapshots by code. */
export interface TieredPreferenceSnapshotStore {
  find(code: string): TieredPreferenceSnapshot | undefined;
  save(item: TieredPreferenceSnapshot): void;
  remove(code: string): boolean;
  list(): TieredPreferenceSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPreferenceSnapshotStore implements TieredPreferenceSnapshotStore {
  items: Map<string, TieredPreferenceSnapshot>;
  order: string[];

  constructor(items: Map<string, TieredPreferenceSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPreferenceSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPreferenceSnapshot): void {
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

  list(): TieredPreferenceSnapshot[] {
    const out: TieredPreferenceSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPreferenceSnapshotStore(): TieredPreferenceSnapshotStore {
  return new MemoryTieredPreferenceSnapshotStore(new Map<string, TieredPreferenceSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPreferenceSnapshotStore implements TieredPreferenceSnapshotStore {
  inner: TieredPreferenceSnapshotStore;
  cache: cache.TtlCache<TieredPreferenceSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPreferenceSnapshotStore,
    cacheValue: cache.TtlCache<TieredPreferenceSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPreferenceSnapshot | undefined {
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

  save(item: TieredPreferenceSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPreferenceSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedTieredPreferenceSnapshotStore(inner: TieredPreferenceSnapshotStore, ttl: number, clockValue: clock.Clock): TieredPreferenceSnapshotStore {
  return new CachedTieredPreferenceSnapshotStore(
    inner,
    cache.newTtlCache<TieredPreferenceSnapshot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered preference snapshots. Empty fields match all. */
export class TieredPreferenceSnapshotQuery {
  unit: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minConversionRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPreferenceSnapshot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPreferenceSnapshot[]): TieredPreferenceSnapshot[] {
    const matched = collections.filter(items, (candidate: TieredPreferenceSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPreferenceSnapshots(store: TieredPreferenceSnapshotStore, query: TieredPreferenceSnapshotQuery): TieredPreferenceSnapshot[] {
  return query.apply(store.list());
}

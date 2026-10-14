import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFrequencySnapshot } from "./tiered-frequency-snapshot.js";

/** Keeps tiered frequency snapshots by code. */
export interface TieredFrequencySnapshotStore {
  find(code: string): TieredFrequencySnapshot | undefined;
  save(item: TieredFrequencySnapshot): void;
  remove(code: string): boolean;
  list(): TieredFrequencySnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFrequencySnapshotStore implements TieredFrequencySnapshotStore {
  items: Map<string, TieredFrequencySnapshot>;
  order: string[];

  constructor(items: Map<string, TieredFrequencySnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFrequencySnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFrequencySnapshot): void {
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

  list(): TieredFrequencySnapshot[] {
    const out: TieredFrequencySnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFrequencySnapshotStore(): TieredFrequencySnapshotStore {
  return new MemoryTieredFrequencySnapshotStore(new Map<string, TieredFrequencySnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFrequencySnapshotStore implements TieredFrequencySnapshotStore {
  inner: TieredFrequencySnapshotStore;
  cache: cache.TtlCache<TieredFrequencySnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFrequencySnapshotStore,
    cacheValue: cache.TtlCache<TieredFrequencySnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFrequencySnapshot | undefined {
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

  save(item: TieredFrequencySnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFrequencySnapshot[] {
    return this.inner.list();
  }
}

export function newCachedTieredFrequencySnapshotStore(inner: TieredFrequencySnapshotStore, ttl: number, clockValue: clock.Clock): TieredFrequencySnapshotStore {
  return new CachedTieredFrequencySnapshotStore(
    inner,
    cache.newTtlCache<TieredFrequencySnapshot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered frequency snapshots. Empty fields match all. */
export class TieredFrequencySnapshotQuery {
  category: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minQuantity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFrequencySnapshot): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFrequencySnapshot[]): TieredFrequencySnapshot[] {
    const matched = collections.filter(items, (candidate: TieredFrequencySnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFrequencySnapshots(store: TieredFrequencySnapshotStore, query: TieredFrequencySnapshotQuery): TieredFrequencySnapshot[] {
  return query.apply(store.list());
}

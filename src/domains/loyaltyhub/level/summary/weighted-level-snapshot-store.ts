import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedLevelSnapshot } from "./weighted-level-snapshot.js";

/** Keeps weighted level snapshots by code. */
export interface WeightedLevelSnapshotStore {
  find(code: string): WeightedLevelSnapshot | undefined;
  save(item: WeightedLevelSnapshot): void;
  remove(code: string): boolean;
  list(): WeightedLevelSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedLevelSnapshotStore implements WeightedLevelSnapshotStore {
  items: Map<string, WeightedLevelSnapshot>;
  order: string[];

  constructor(items: Map<string, WeightedLevelSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedLevelSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedLevelSnapshot): void {
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

  list(): WeightedLevelSnapshot[] {
    const out: WeightedLevelSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedLevelSnapshotStore(): WeightedLevelSnapshotStore {
  return new MemoryWeightedLevelSnapshotStore(new Map<string, WeightedLevelSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedLevelSnapshotStore implements WeightedLevelSnapshotStore {
  inner: WeightedLevelSnapshotStore;
  cache: cache.TtlCache<WeightedLevelSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedLevelSnapshotStore,
    cacheValue: cache.TtlCache<WeightedLevelSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedLevelSnapshot | undefined {
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

  save(item: WeightedLevelSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedLevelSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedWeightedLevelSnapshotStore(inner: WeightedLevelSnapshotStore, ttl: number, clockValue: clock.Clock): WeightedLevelSnapshotStore {
  return new CachedWeightedLevelSnapshotStore(
    inner,
    cache.newTtlCache<WeightedLevelSnapshot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted level snapshots. Empty fields match all. */
export class WeightedLevelSnapshotQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedLevelSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedLevelSnapshot[]): WeightedLevelSnapshot[] {
    const matched = collections.filter(items, (candidate: WeightedLevelSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedLevelSnapshots(store: WeightedLevelSnapshotStore, query: WeightedLevelSnapshotQuery): WeightedLevelSnapshot[] {
  return query.apply(store.list());
}

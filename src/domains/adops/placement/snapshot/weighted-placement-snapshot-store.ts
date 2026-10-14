import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPlacementSnapshot } from "./weighted-placement-snapshot.js";

/** Keeps weighted placement snapshots by code. */
export interface WeightedPlacementSnapshotStore {
  find(code: string): WeightedPlacementSnapshot | undefined;
  save(item: WeightedPlacementSnapshot): void;
  remove(code: string): boolean;
  list(): WeightedPlacementSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPlacementSnapshotStore implements WeightedPlacementSnapshotStore {
  items: Map<string, WeightedPlacementSnapshot>;
  order: string[];

  constructor(items: Map<string, WeightedPlacementSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPlacementSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPlacementSnapshot): void {
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

  list(): WeightedPlacementSnapshot[] {
    const out: WeightedPlacementSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPlacementSnapshotStore(): WeightedPlacementSnapshotStore {
  return new MemoryWeightedPlacementSnapshotStore(new Map<string, WeightedPlacementSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPlacementSnapshotStore implements WeightedPlacementSnapshotStore {
  inner: WeightedPlacementSnapshotStore;
  cache: cache.TtlCache<WeightedPlacementSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPlacementSnapshotStore,
    cacheValue: cache.TtlCache<WeightedPlacementSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPlacementSnapshot | undefined {
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

  save(item: WeightedPlacementSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPlacementSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPlacementSnapshotStore(inner: WeightedPlacementSnapshotStore, ttl: number, clockValue: clock.Clock): WeightedPlacementSnapshotStore {
  return new CachedWeightedPlacementSnapshotStore(
    inner,
    cache.newTtlCache<WeightedPlacementSnapshot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted placement snapshots. Empty fields match all. */
export class WeightedPlacementSnapshotQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPlacementSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPlacementSnapshot[]): WeightedPlacementSnapshot[] {
    const matched = collections.filter(items, (candidate: WeightedPlacementSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPlacementSnapshots(store: WeightedPlacementSnapshotStore, query: WeightedPlacementSnapshotQuery): WeightedPlacementSnapshot[] {
  return query.apply(store.list());
}

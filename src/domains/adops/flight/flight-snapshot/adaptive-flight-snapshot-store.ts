import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFlightSnapshot } from "./adaptive-flight-snapshot.js";

/** Keeps adaptive flight snapshots by code. */
export interface AdaptiveFlightSnapshotStore {
  find(code: string): AdaptiveFlightSnapshot | undefined;
  save(item: AdaptiveFlightSnapshot): void;
  remove(code: string): boolean;
  list(): AdaptiveFlightSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFlightSnapshotStore implements AdaptiveFlightSnapshotStore {
  items: Map<string, AdaptiveFlightSnapshot>;
  order: string[];

  constructor(items: Map<string, AdaptiveFlightSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFlightSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFlightSnapshot): void {
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

  list(): AdaptiveFlightSnapshot[] {
    const out: AdaptiveFlightSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFlightSnapshotStore(): AdaptiveFlightSnapshotStore {
  return new MemoryAdaptiveFlightSnapshotStore(new Map<string, AdaptiveFlightSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFlightSnapshotStore implements AdaptiveFlightSnapshotStore {
  inner: AdaptiveFlightSnapshotStore;
  cache: cache.TtlCache<AdaptiveFlightSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFlightSnapshotStore,
    cacheValue: cache.TtlCache<AdaptiveFlightSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFlightSnapshot | undefined {
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

  save(item: AdaptiveFlightSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFlightSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFlightSnapshotStore(inner: AdaptiveFlightSnapshotStore, ttl: number, clockValue: clock.Clock): AdaptiveFlightSnapshotStore {
  return new CachedAdaptiveFlightSnapshotStore(
    inner,
    cache.newTtlCache<AdaptiveFlightSnapshot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive flight snapshots. Empty fields match all. */
export class AdaptiveFlightSnapshotQuery {
  region: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRatio: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFlightSnapshot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFlightSnapshot[]): AdaptiveFlightSnapshot[] {
    const matched = collections.filter(items, (candidate: AdaptiveFlightSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFlightSnapshots(store: AdaptiveFlightSnapshotStore, query: AdaptiveFlightSnapshotQuery): AdaptiveFlightSnapshot[] {
  return query.apply(store.list());
}

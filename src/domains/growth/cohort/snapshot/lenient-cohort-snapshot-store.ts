import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientCohortSnapshot } from "./lenient-cohort-snapshot.js";

/** Keeps lenient cohort snapshots by code. */
export interface LenientCohortSnapshotStore {
  find(code: string): LenientCohortSnapshot | undefined;
  save(item: LenientCohortSnapshot): void;
  remove(code: string): boolean;
  list(): LenientCohortSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientCohortSnapshotStore implements LenientCohortSnapshotStore {
  items: Map<string, LenientCohortSnapshot>;
  order: string[];

  constructor(items: Map<string, LenientCohortSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientCohortSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientCohortSnapshot): void {
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

  list(): LenientCohortSnapshot[] {
    const out: LenientCohortSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientCohortSnapshotStore(): LenientCohortSnapshotStore {
  return new MemoryLenientCohortSnapshotStore(new Map<string, LenientCohortSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientCohortSnapshotStore implements LenientCohortSnapshotStore {
  inner: LenientCohortSnapshotStore;
  cache: cache.TtlCache<LenientCohortSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientCohortSnapshotStore,
    cacheValue: cache.TtlCache<LenientCohortSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientCohortSnapshot | undefined {
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

  save(item: LenientCohortSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientCohortSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedLenientCohortSnapshotStore(inner: LenientCohortSnapshotStore, ttl: number, clockValue: clock.Clock): LenientCohortSnapshotStore {
  return new CachedLenientCohortSnapshotStore(
    inner,
    cache.newTtlCache<LenientCohortSnapshot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient cohort snapshots. Empty fields match all. */
export class LenientCohortSnapshotQuery {
  unit: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minFloorValue: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientCohortSnapshot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientCohortSnapshot[]): LenientCohortSnapshot[] {
    const matched = collections.filter(items, (candidate: LenientCohortSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientCohortSnapshots(store: LenientCohortSnapshotStore, query: LenientCohortSnapshotQuery): LenientCohortSnapshot[] {
  return query.apply(store.list());
}

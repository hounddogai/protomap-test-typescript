import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortSnapshot } from "./cohort-snapshot.js";

/** Keeps cohort snapshots by code. */
export interface CohortSnapshotStore {
  find(code: string): CohortSnapshot | undefined;
  save(item: CohortSnapshot): void;
  remove(code: string): boolean;
  list(): CohortSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortSnapshotStore implements CohortSnapshotStore {
  items: Map<string, CohortSnapshot>;
  order: string[];

  constructor(items: Map<string, CohortSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortSnapshot): void {
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

  list(): CohortSnapshot[] {
    const out: CohortSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortSnapshotStore(): CohortSnapshotStore {
  return new MemoryCohortSnapshotStore(new Map<string, CohortSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortSnapshotStore implements CohortSnapshotStore {
  inner: CohortSnapshotStore;
  cache: cache.TtlCache<CohortSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortSnapshotStore,
    cacheValue: cache.TtlCache<CohortSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortSnapshot | undefined {
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

  save(item: CohortSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedCohortSnapshotStore(inner: CohortSnapshotStore, ttl: number, clockValue: clock.Clock): CohortSnapshotStore {
  return new CachedCohortSnapshotStore(inner, cache.newTtlCache<CohortSnapshot>(512, ttl, clockValue), 0, 0);
}

/** Selects cohort snapshots. Empty fields match all. */
export class CohortSnapshotQuery {
  segment: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minThreshold: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortSnapshot): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortSnapshot[]): CohortSnapshot[] {
    const matched = collections.filter(items, (candidate: CohortSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortSnapshots(store: CohortSnapshotStore, query: CohortSnapshotQuery): CohortSnapshot[] {
  return query.apply(store.list());
}

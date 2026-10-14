import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalEnrollmentSnapshot } from "./regional-enrollment-snapshot.js";

/** Keeps regional enrollment snapshots by code. */
export interface RegionalEnrollmentSnapshotStore {
  find(code: string): RegionalEnrollmentSnapshot | undefined;
  save(item: RegionalEnrollmentSnapshot): void;
  remove(code: string): boolean;
  list(): RegionalEnrollmentSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalEnrollmentSnapshotStore implements RegionalEnrollmentSnapshotStore {
  items: Map<string, RegionalEnrollmentSnapshot>;
  order: string[];

  constructor(items: Map<string, RegionalEnrollmentSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalEnrollmentSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalEnrollmentSnapshot): void {
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

  list(): RegionalEnrollmentSnapshot[] {
    const out: RegionalEnrollmentSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalEnrollmentSnapshotStore(): RegionalEnrollmentSnapshotStore {
  return new MemoryRegionalEnrollmentSnapshotStore(new Map<string, RegionalEnrollmentSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalEnrollmentSnapshotStore implements RegionalEnrollmentSnapshotStore {
  inner: RegionalEnrollmentSnapshotStore;
  cache: cache.TtlCache<RegionalEnrollmentSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalEnrollmentSnapshotStore,
    cacheValue: cache.TtlCache<RegionalEnrollmentSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalEnrollmentSnapshot | undefined {
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

  save(item: RegionalEnrollmentSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalEnrollmentSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalEnrollmentSnapshotStore(inner: RegionalEnrollmentSnapshotStore, ttl: number, clockValue: clock.Clock): RegionalEnrollmentSnapshotStore {
  return new CachedRegionalEnrollmentSnapshotStore(
    inner,
    cache.newTtlCache<RegionalEnrollmentSnapshot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional enrollment snapshots. Empty fields match all. */
export class RegionalEnrollmentSnapshotQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalEnrollmentSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalEnrollmentSnapshot[]): RegionalEnrollmentSnapshot[] {
    const matched = collections.filter(items, (candidate: RegionalEnrollmentSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalEnrollmentSnapshots(store: RegionalEnrollmentSnapshotStore, query: RegionalEnrollmentSnapshotQuery): RegionalEnrollmentSnapshot[] {
  return query.apply(store.list());
}

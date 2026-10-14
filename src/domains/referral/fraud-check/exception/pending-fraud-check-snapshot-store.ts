import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFraudCheckSnapshot } from "./pending-fraud-check-snapshot.js";

/** Keeps pending fraud check snapshots by code. */
export interface PendingFraudCheckSnapshotStore {
  find(code: string): PendingFraudCheckSnapshot | undefined;
  save(item: PendingFraudCheckSnapshot): void;
  remove(code: string): boolean;
  list(): PendingFraudCheckSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFraudCheckSnapshotStore implements PendingFraudCheckSnapshotStore {
  items: Map<string, PendingFraudCheckSnapshot>;
  order: string[];

  constructor(items: Map<string, PendingFraudCheckSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFraudCheckSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFraudCheckSnapshot): void {
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

  list(): PendingFraudCheckSnapshot[] {
    const out: PendingFraudCheckSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFraudCheckSnapshotStore(): PendingFraudCheckSnapshotStore {
  return new MemoryPendingFraudCheckSnapshotStore(new Map<string, PendingFraudCheckSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFraudCheckSnapshotStore implements PendingFraudCheckSnapshotStore {
  inner: PendingFraudCheckSnapshotStore;
  cache: cache.TtlCache<PendingFraudCheckSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFraudCheckSnapshotStore,
    cacheValue: cache.TtlCache<PendingFraudCheckSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFraudCheckSnapshot | undefined {
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

  save(item: PendingFraudCheckSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFraudCheckSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedPendingFraudCheckSnapshotStore(inner: PendingFraudCheckSnapshotStore, ttl: number, clockValue: clock.Clock): PendingFraudCheckSnapshotStore {
  return new CachedPendingFraudCheckSnapshotStore(
    inner,
    cache.newTtlCache<PendingFraudCheckSnapshot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending fraud check snapshots. Empty fields match all. */
export class PendingFraudCheckSnapshotQuery {
  country: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minPriority: number, statuses: string[], limit: number) {
    this.country = country;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFraudCheckSnapshot): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFraudCheckSnapshot[]): PendingFraudCheckSnapshot[] {
    const matched = collections.filter(items, (candidate: PendingFraudCheckSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFraudCheckSnapshots(store: PendingFraudCheckSnapshotStore, query: PendingFraudCheckSnapshotQuery): PendingFraudCheckSnapshot[] {
  return query.apply(store.list());
}

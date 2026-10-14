import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackReputationSnapshot } from "./fallback-reputation-snapshot.js";

/** Keeps fallback reputation snapshots by code. */
export interface FallbackReputationSnapshotStore {
  find(code: string): FallbackReputationSnapshot | undefined;
  save(item: FallbackReputationSnapshot): void;
  remove(code: string): boolean;
  list(): FallbackReputationSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackReputationSnapshotStore implements FallbackReputationSnapshotStore {
  items: Map<string, FallbackReputationSnapshot>;
  order: string[];

  constructor(items: Map<string, FallbackReputationSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackReputationSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackReputationSnapshot): void {
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

  list(): FallbackReputationSnapshot[] {
    const out: FallbackReputationSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackReputationSnapshotStore(): FallbackReputationSnapshotStore {
  return new MemoryFallbackReputationSnapshotStore(new Map<string, FallbackReputationSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackReputationSnapshotStore implements FallbackReputationSnapshotStore {
  inner: FallbackReputationSnapshotStore;
  cache: cache.TtlCache<FallbackReputationSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackReputationSnapshotStore,
    cacheValue: cache.TtlCache<FallbackReputationSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackReputationSnapshot | undefined {
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

  save(item: FallbackReputationSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackReputationSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedFallbackReputationSnapshotStore(inner: FallbackReputationSnapshotStore, ttl: number, clockValue: clock.Clock): FallbackReputationSnapshotStore {
  return new CachedFallbackReputationSnapshotStore(
    inner,
    cache.newTtlCache<FallbackReputationSnapshot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback reputation snapshots. Empty fields match all. */
export class FallbackReputationSnapshotQuery {
  unit: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minPriority: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackReputationSnapshot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackReputationSnapshot[]): FallbackReputationSnapshot[] {
    const matched = collections.filter(items, (candidate: FallbackReputationSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackReputationSnapshots(store: FallbackReputationSnapshotStore, query: FallbackReputationSnapshotQuery): FallbackReputationSnapshot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBranchSnapshot } from "./tiered-branch-snapshot.js";

/** Keeps tiered branch snapshots by code. */
export interface TieredBranchSnapshotStore {
  find(code: string): TieredBranchSnapshot | undefined;
  save(item: TieredBranchSnapshot): void;
  remove(code: string): boolean;
  list(): TieredBranchSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBranchSnapshotStore implements TieredBranchSnapshotStore {
  items: Map<string, TieredBranchSnapshot>;
  order: string[];

  constructor(items: Map<string, TieredBranchSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBranchSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBranchSnapshot): void {
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

  list(): TieredBranchSnapshot[] {
    const out: TieredBranchSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBranchSnapshotStore(): TieredBranchSnapshotStore {
  return new MemoryTieredBranchSnapshotStore(new Map<string, TieredBranchSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBranchSnapshotStore implements TieredBranchSnapshotStore {
  inner: TieredBranchSnapshotStore;
  cache: cache.TtlCache<TieredBranchSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBranchSnapshotStore,
    cacheValue: cache.TtlCache<TieredBranchSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBranchSnapshot | undefined {
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

  save(item: TieredBranchSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBranchSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedTieredBranchSnapshotStore(inner: TieredBranchSnapshotStore, ttl: number, clockValue: clock.Clock): TieredBranchSnapshotStore {
  return new CachedTieredBranchSnapshotStore(
    inner,
    cache.newTtlCache<TieredBranchSnapshot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered branch snapshots. Empty fields match all. */
export class TieredBranchSnapshotQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBranchSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBranchSnapshot[]): TieredBranchSnapshot[] {
    const matched = collections.filter(items, (candidate: TieredBranchSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBranchSnapshots(store: TieredBranchSnapshotStore, query: TieredBranchSnapshotQuery): TieredBranchSnapshot[] {
  return query.apply(store.list());
}

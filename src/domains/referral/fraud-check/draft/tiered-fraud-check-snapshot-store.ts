import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFraudCheckSnapshot } from "./tiered-fraud-check-snapshot.js";

/** Keeps tiered fraud check snapshots by code. */
export interface TieredFraudCheckSnapshotStore {
  find(code: string): TieredFraudCheckSnapshot | undefined;
  save(item: TieredFraudCheckSnapshot): void;
  remove(code: string): boolean;
  list(): TieredFraudCheckSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFraudCheckSnapshotStore implements TieredFraudCheckSnapshotStore {
  items: Map<string, TieredFraudCheckSnapshot>;
  order: string[];

  constructor(items: Map<string, TieredFraudCheckSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFraudCheckSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFraudCheckSnapshot): void {
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

  list(): TieredFraudCheckSnapshot[] {
    const out: TieredFraudCheckSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFraudCheckSnapshotStore(): TieredFraudCheckSnapshotStore {
  return new MemoryTieredFraudCheckSnapshotStore(new Map<string, TieredFraudCheckSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFraudCheckSnapshotStore implements TieredFraudCheckSnapshotStore {
  inner: TieredFraudCheckSnapshotStore;
  cache: cache.TtlCache<TieredFraudCheckSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFraudCheckSnapshotStore,
    cacheValue: cache.TtlCache<TieredFraudCheckSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFraudCheckSnapshot | undefined {
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

  save(item: TieredFraudCheckSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFraudCheckSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedTieredFraudCheckSnapshotStore(inner: TieredFraudCheckSnapshotStore, ttl: number, clockValue: clock.Clock): TieredFraudCheckSnapshotStore {
  return new CachedTieredFraudCheckSnapshotStore(
    inner,
    cache.newTtlCache<TieredFraudCheckSnapshot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered fraud check snapshots. Empty fields match all. */
export class TieredFraudCheckSnapshotQuery {
  label: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRevision: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFraudCheckSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFraudCheckSnapshot[]): TieredFraudCheckSnapshot[] {
    const matched = collections.filter(items, (candidate: TieredFraudCheckSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFraudCheckSnapshots(store: TieredFraudCheckSnapshotStore, query: TieredFraudCheckSnapshotQuery): TieredFraudCheckSnapshot[] {
  return query.apply(store.list());
}

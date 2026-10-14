import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedTouchpointSnapshot } from "./capped-touchpoint-snapshot.js";

/** Keeps capped touchpoint snapshots by code. */
export interface CappedTouchpointSnapshotStore {
  find(code: string): CappedTouchpointSnapshot | undefined;
  save(item: CappedTouchpointSnapshot): void;
  remove(code: string): boolean;
  list(): CappedTouchpointSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedTouchpointSnapshotStore implements CappedTouchpointSnapshotStore {
  items: Map<string, CappedTouchpointSnapshot>;
  order: string[];

  constructor(items: Map<string, CappedTouchpointSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedTouchpointSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedTouchpointSnapshot): void {
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

  list(): CappedTouchpointSnapshot[] {
    const out: CappedTouchpointSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedTouchpointSnapshotStore(): CappedTouchpointSnapshotStore {
  return new MemoryCappedTouchpointSnapshotStore(new Map<string, CappedTouchpointSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedTouchpointSnapshotStore implements CappedTouchpointSnapshotStore {
  inner: CappedTouchpointSnapshotStore;
  cache: cache.TtlCache<CappedTouchpointSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedTouchpointSnapshotStore,
    cacheValue: cache.TtlCache<CappedTouchpointSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedTouchpointSnapshot | undefined {
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

  save(item: CappedTouchpointSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedTouchpointSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedCappedTouchpointSnapshotStore(inner: CappedTouchpointSnapshotStore, ttl: number, clockValue: clock.Clock): CappedTouchpointSnapshotStore {
  return new CachedCappedTouchpointSnapshotStore(
    inner,
    cache.newTtlCache<CappedTouchpointSnapshot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped touchpoint snapshots. Empty fields match all. */
export class CappedTouchpointSnapshotQuery {
  region: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMaximum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedTouchpointSnapshot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedTouchpointSnapshot[]): CappedTouchpointSnapshot[] {
    const matched = collections.filter(items, (candidate: CappedTouchpointSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedTouchpointSnapshots(store: CappedTouchpointSnapshotStore, query: CappedTouchpointSnapshotQuery): CappedTouchpointSnapshot[] {
  return query.apply(store.list());
}

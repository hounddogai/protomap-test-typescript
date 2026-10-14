import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementSnapshot } from "./placement-snapshot.js";

/** Keeps placement snapshots by code. */
export interface PlacementSnapshotStore {
  find(code: string): PlacementSnapshot | undefined;
  save(item: PlacementSnapshot): void;
  remove(code: string): boolean;
  list(): PlacementSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementSnapshotStore implements PlacementSnapshotStore {
  items: Map<string, PlacementSnapshot>;
  order: string[];

  constructor(items: Map<string, PlacementSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementSnapshot): void {
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

  list(): PlacementSnapshot[] {
    const out: PlacementSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementSnapshotStore(): PlacementSnapshotStore {
  return new MemoryPlacementSnapshotStore(new Map<string, PlacementSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementSnapshotStore implements PlacementSnapshotStore {
  inner: PlacementSnapshotStore;
  cache: cache.TtlCache<PlacementSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementSnapshotStore,
    cacheValue: cache.TtlCache<PlacementSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementSnapshot | undefined {
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

  save(item: PlacementSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedPlacementSnapshotStore(inner: PlacementSnapshotStore, ttl: number, clockValue: clock.Clock): PlacementSnapshotStore {
  return new CachedPlacementSnapshotStore(inner, cache.newTtlCache<PlacementSnapshot>(1024, ttl, clockValue), 0, 0);
}

/** Selects placement snapshots. Empty fields match all. */
export class PlacementSnapshotQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementSnapshot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementSnapshot[]): PlacementSnapshot[] {
    const matched = collections.filter(items, (candidate: PlacementSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementSnapshots(store: PlacementSnapshotStore, query: PlacementSnapshotQuery): PlacementSnapshot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointSnapshot } from "./touchpoint-snapshot.js";

/** Keeps touchpoint snapshots by code. */
export interface TouchpointSnapshotStore {
  find(code: string): TouchpointSnapshot | undefined;
  save(item: TouchpointSnapshot): void;
  remove(code: string): boolean;
  list(): TouchpointSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointSnapshotStore implements TouchpointSnapshotStore {
  items: Map<string, TouchpointSnapshot>;
  order: string[];

  constructor(items: Map<string, TouchpointSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointSnapshot): void {
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

  list(): TouchpointSnapshot[] {
    const out: TouchpointSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointSnapshotStore(): TouchpointSnapshotStore {
  return new MemoryTouchpointSnapshotStore(new Map<string, TouchpointSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointSnapshotStore implements TouchpointSnapshotStore {
  inner: TouchpointSnapshotStore;
  cache: cache.TtlCache<TouchpointSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointSnapshotStore,
    cacheValue: cache.TtlCache<TouchpointSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointSnapshot | undefined {
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

  save(item: TouchpointSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointSnapshotStore(inner: TouchpointSnapshotStore, ttl: number, clockValue: clock.Clock): TouchpointSnapshotStore {
  return new CachedTouchpointSnapshotStore(inner, cache.newTtlCache<TouchpointSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects touchpoint snapshots. Empty fields match all. */
export class TouchpointSnapshotQuery {
  source: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWindowDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointSnapshot): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointSnapshot[]): TouchpointSnapshot[] {
    const matched = collections.filter(items, (candidate: TouchpointSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointSnapshots(store: TouchpointSnapshotStore, query: TouchpointSnapshotQuery): TouchpointSnapshot[] {
  return query.apply(store.list());
}

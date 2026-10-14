import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathSnapshot } from "./path-snapshot.js";

/** Keeps path snapshots by code. */
export interface PathSnapshotStore {
  find(code: string): PathSnapshot | undefined;
  save(item: PathSnapshot): void;
  remove(code: string): boolean;
  list(): PathSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathSnapshotStore implements PathSnapshotStore {
  items: Map<string, PathSnapshot>;
  order: string[];

  constructor(items: Map<string, PathSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathSnapshot): void {
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

  list(): PathSnapshot[] {
    const out: PathSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathSnapshotStore(): PathSnapshotStore {
  return new MemoryPathSnapshotStore(new Map<string, PathSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathSnapshotStore implements PathSnapshotStore {
  inner: PathSnapshotStore;
  cache: cache.TtlCache<PathSnapshot>;
  hits: number;
  misses: number;

  constructor(inner: PathSnapshotStore, cacheValue: cache.TtlCache<PathSnapshot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathSnapshot | undefined {
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

  save(item: PathSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedPathSnapshotStore(inner: PathSnapshotStore, ttl: number, clockValue: clock.Clock): PathSnapshotStore {
  return new CachedPathSnapshotStore(inner, cache.newTtlCache<PathSnapshot>(256, ttl, clockValue), 0, 0);
}

/** Selects path snapshots. Empty fields match all. */
export class PathSnapshotQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathSnapshot[]): PathSnapshot[] {
    const matched = collections.filter(items, (candidate: PathSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathSnapshots(store: PathSnapshotStore, query: PathSnapshotQuery): PathSnapshot[] {
  return query.apply(store.list());
}

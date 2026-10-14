import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowSnapshot } from "./window-snapshot.js";

/** Keeps window snapshots by code. */
export interface WindowSnapshotStore {
  find(code: string): WindowSnapshot | undefined;
  save(item: WindowSnapshot): void;
  remove(code: string): boolean;
  list(): WindowSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowSnapshotStore implements WindowSnapshotStore {
  items: Map<string, WindowSnapshot>;
  order: string[];

  constructor(items: Map<string, WindowSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowSnapshot): void {
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

  list(): WindowSnapshot[] {
    const out: WindowSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowSnapshotStore(): WindowSnapshotStore {
  return new MemoryWindowSnapshotStore(new Map<string, WindowSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowSnapshotStore implements WindowSnapshotStore {
  inner: WindowSnapshotStore;
  cache: cache.TtlCache<WindowSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowSnapshotStore,
    cacheValue: cache.TtlCache<WindowSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowSnapshot | undefined {
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

  save(item: WindowSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedWindowSnapshotStore(inner: WindowSnapshotStore, ttl: number, clockValue: clock.Clock): WindowSnapshotStore {
  return new CachedWindowSnapshotStore(inner, cache.newTtlCache<WindowSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects window snapshots. Empty fields match all. */
export class WindowSnapshotQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowSnapshot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowSnapshot[]): WindowSnapshot[] {
    const matched = collections.filter(items, (candidate: WindowSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowSnapshots(store: WindowSnapshotStore, query: WindowSnapshotQuery): WindowSnapshot[] {
  return query.apply(store.list());
}

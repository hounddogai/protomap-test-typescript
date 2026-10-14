import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

/** Keeps double opt in snapshots by code. */
export interface DoubleOptInSnapshotStore {
  find(code: string): DoubleOptInSnapshot | undefined;
  save(item: DoubleOptInSnapshot): void;
  remove(code: string): boolean;
  list(): DoubleOptInSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInSnapshotStore implements DoubleOptInSnapshotStore {
  items: Map<string, DoubleOptInSnapshot>;
  order: string[];

  constructor(items: Map<string, DoubleOptInSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInSnapshot): void {
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

  list(): DoubleOptInSnapshot[] {
    const out: DoubleOptInSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInSnapshotStore(): DoubleOptInSnapshotStore {
  return new MemoryDoubleOptInSnapshotStore(new Map<string, DoubleOptInSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInSnapshotStore implements DoubleOptInSnapshotStore {
  inner: DoubleOptInSnapshotStore;
  cache: cache.TtlCache<DoubleOptInSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInSnapshotStore,
    cacheValue: cache.TtlCache<DoubleOptInSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInSnapshot | undefined {
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

  save(item: DoubleOptInSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInSnapshotStore(inner: DoubleOptInSnapshotStore, ttl: number, clockValue: clock.Clock): DoubleOptInSnapshotStore {
  return new CachedDoubleOptInSnapshotStore(inner, cache.newTtlCache<DoubleOptInSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects double opt in snapshots. Empty fields match all. */
export class DoubleOptInSnapshotQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInSnapshot[]): DoubleOptInSnapshot[] {
    const matched = collections.filter(items, (candidate: DoubleOptInSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInSnapshots(store: DoubleOptInSnapshotStore, query: DoubleOptInSnapshotQuery): DoubleOptInSnapshot[] {
  return query.apply(store.list());
}

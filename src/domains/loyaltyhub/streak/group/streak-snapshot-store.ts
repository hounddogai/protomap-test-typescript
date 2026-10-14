import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakSnapshot } from "./streak-snapshot.js";

/** Keeps streak snapshots by code. */
export interface StreakSnapshotStore {
  find(code: string): StreakSnapshot | undefined;
  save(item: StreakSnapshot): void;
  remove(code: string): boolean;
  list(): StreakSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakSnapshotStore implements StreakSnapshotStore {
  items: Map<string, StreakSnapshot>;
  order: string[];

  constructor(items: Map<string, StreakSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakSnapshot): void {
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

  list(): StreakSnapshot[] {
    const out: StreakSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakSnapshotStore(): StreakSnapshotStore {
  return new MemoryStreakSnapshotStore(new Map<string, StreakSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakSnapshotStore implements StreakSnapshotStore {
  inner: StreakSnapshotStore;
  cache: cache.TtlCache<StreakSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: StreakSnapshotStore,
    cacheValue: cache.TtlCache<StreakSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakSnapshot | undefined {
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

  save(item: StreakSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedStreakSnapshotStore(inner: StreakSnapshotStore, ttl: number, clockValue: clock.Clock): StreakSnapshotStore {
  return new CachedStreakSnapshotStore(inner, cache.newTtlCache<StreakSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects streak snapshots. Empty fields match all. */
export class StreakSnapshotQuery {
  channel: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBid: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakSnapshot[]): StreakSnapshot[] {
    const matched = collections.filter(items, (candidate: StreakSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakSnapshots(store: StreakSnapshotStore, query: StreakSnapshotQuery): StreakSnapshot[] {
  return query.apply(store.list());
}

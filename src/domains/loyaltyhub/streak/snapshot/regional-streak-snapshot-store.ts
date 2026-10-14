import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalStreakSnapshot } from "./regional-streak-snapshot.js";

/** Keeps regional streak snapshots by code. */
export interface RegionalStreakSnapshotStore {
  find(code: string): RegionalStreakSnapshot | undefined;
  save(item: RegionalStreakSnapshot): void;
  remove(code: string): boolean;
  list(): RegionalStreakSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalStreakSnapshotStore implements RegionalStreakSnapshotStore {
  items: Map<string, RegionalStreakSnapshot>;
  order: string[];

  constructor(items: Map<string, RegionalStreakSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalStreakSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalStreakSnapshot): void {
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

  list(): RegionalStreakSnapshot[] {
    const out: RegionalStreakSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalStreakSnapshotStore(): RegionalStreakSnapshotStore {
  return new MemoryRegionalStreakSnapshotStore(new Map<string, RegionalStreakSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalStreakSnapshotStore implements RegionalStreakSnapshotStore {
  inner: RegionalStreakSnapshotStore;
  cache: cache.TtlCache<RegionalStreakSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalStreakSnapshotStore,
    cacheValue: cache.TtlCache<RegionalStreakSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalStreakSnapshot | undefined {
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

  save(item: RegionalStreakSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalStreakSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalStreakSnapshotStore(inner: RegionalStreakSnapshotStore, ttl: number, clockValue: clock.Clock): RegionalStreakSnapshotStore {
  return new CachedRegionalStreakSnapshotStore(
    inner,
    cache.newTtlCache<RegionalStreakSnapshot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional streak snapshots. Empty fields match all. */
export class RegionalStreakSnapshotQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalStreakSnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalStreakSnapshot[]): RegionalStreakSnapshot[] {
    const matched = collections.filter(items, (candidate: RegionalStreakSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalStreakSnapshots(store: RegionalStreakSnapshotStore, query: RegionalStreakSnapshotQuery): RegionalStreakSnapshot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalWaitSnapshot } from "./regional-wait-snapshot.js";

/** Keeps regional wait snapshots by code. */
export interface RegionalWaitSnapshotStore {
  find(code: string): RegionalWaitSnapshot | undefined;
  save(item: RegionalWaitSnapshot): void;
  remove(code: string): boolean;
  list(): RegionalWaitSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalWaitSnapshotStore implements RegionalWaitSnapshotStore {
  items: Map<string, RegionalWaitSnapshot>;
  order: string[];

  constructor(items: Map<string, RegionalWaitSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalWaitSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalWaitSnapshot): void {
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

  list(): RegionalWaitSnapshot[] {
    const out: RegionalWaitSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalWaitSnapshotStore(): RegionalWaitSnapshotStore {
  return new MemoryRegionalWaitSnapshotStore(new Map<string, RegionalWaitSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalWaitSnapshotStore implements RegionalWaitSnapshotStore {
  inner: RegionalWaitSnapshotStore;
  cache: cache.TtlCache<RegionalWaitSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalWaitSnapshotStore,
    cacheValue: cache.TtlCache<RegionalWaitSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalWaitSnapshot | undefined {
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

  save(item: RegionalWaitSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalWaitSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalWaitSnapshotStore(inner: RegionalWaitSnapshotStore, ttl: number, clockValue: clock.Clock): RegionalWaitSnapshotStore {
  return new CachedRegionalWaitSnapshotStore(
    inner,
    cache.newTtlCache<RegionalWaitSnapshot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional wait snapshots. Empty fields match all. */
export class RegionalWaitSnapshotQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalWaitSnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalWaitSnapshot[]): RegionalWaitSnapshot[] {
    const matched = collections.filter(items, (candidate: RegionalWaitSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalWaitSnapshots(store: RegionalWaitSnapshotStore, query: RegionalWaitSnapshotQuery): RegionalWaitSnapshot[] {
  return query.apply(store.list());
}

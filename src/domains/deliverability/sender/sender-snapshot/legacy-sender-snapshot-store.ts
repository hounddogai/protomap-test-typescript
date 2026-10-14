import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacySenderSnapshot } from "./legacy-sender-snapshot.js";

/** Keeps legacy sender snapshots by code. */
export interface LegacySenderSnapshotStore {
  find(code: string): LegacySenderSnapshot | undefined;
  save(item: LegacySenderSnapshot): void;
  remove(code: string): boolean;
  list(): LegacySenderSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacySenderSnapshotStore implements LegacySenderSnapshotStore {
  items: Map<string, LegacySenderSnapshot>;
  order: string[];

  constructor(items: Map<string, LegacySenderSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacySenderSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacySenderSnapshot): void {
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

  list(): LegacySenderSnapshot[] {
    const out: LegacySenderSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacySenderSnapshotStore(): LegacySenderSnapshotStore {
  return new MemoryLegacySenderSnapshotStore(new Map<string, LegacySenderSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacySenderSnapshotStore implements LegacySenderSnapshotStore {
  inner: LegacySenderSnapshotStore;
  cache: cache.TtlCache<LegacySenderSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacySenderSnapshotStore,
    cacheValue: cache.TtlCache<LegacySenderSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacySenderSnapshot | undefined {
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

  save(item: LegacySenderSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacySenderSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedLegacySenderSnapshotStore(inner: LegacySenderSnapshotStore, ttl: number, clockValue: clock.Clock): LegacySenderSnapshotStore {
  return new CachedLegacySenderSnapshotStore(
    inner,
    cache.newTtlCache<LegacySenderSnapshot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy sender snapshots. Empty fields match all. */
export class LegacySenderSnapshotQuery {
  name: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWindowDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacySenderSnapshot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacySenderSnapshot[]): LegacySenderSnapshot[] {
    const matched = collections.filter(items, (candidate: LegacySenderSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacySenderSnapshots(store: LegacySenderSnapshotStore, query: LegacySenderSnapshotQuery): LegacySenderSnapshot[] {
  return query.apply(store.list());
}

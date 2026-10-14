import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalSenderSnapshot } from "./regional-sender-snapshot.js";

/** Keeps regional sender snapshots by code. */
export interface RegionalSenderSnapshotStore {
  find(code: string): RegionalSenderSnapshot | undefined;
  save(item: RegionalSenderSnapshot): void;
  remove(code: string): boolean;
  list(): RegionalSenderSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalSenderSnapshotStore implements RegionalSenderSnapshotStore {
  items: Map<string, RegionalSenderSnapshot>;
  order: string[];

  constructor(items: Map<string, RegionalSenderSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalSenderSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalSenderSnapshot): void {
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

  list(): RegionalSenderSnapshot[] {
    const out: RegionalSenderSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalSenderSnapshotStore(): RegionalSenderSnapshotStore {
  return new MemoryRegionalSenderSnapshotStore(new Map<string, RegionalSenderSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalSenderSnapshotStore implements RegionalSenderSnapshotStore {
  inner: RegionalSenderSnapshotStore;
  cache: cache.TtlCache<RegionalSenderSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalSenderSnapshotStore,
    cacheValue: cache.TtlCache<RegionalSenderSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalSenderSnapshot | undefined {
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

  save(item: RegionalSenderSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalSenderSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalSenderSnapshotStore(inner: RegionalSenderSnapshotStore, ttl: number, clockValue: clock.Clock): RegionalSenderSnapshotStore {
  return new CachedRegionalSenderSnapshotStore(
    inner,
    cache.newTtlCache<RegionalSenderSnapshot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional sender snapshots. Empty fields match all. */
export class RegionalSenderSnapshotQuery {
  region: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minVersion: number, statuses: string[], limit: number) {
    this.region = region;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalSenderSnapshot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalSenderSnapshot[]): RegionalSenderSnapshot[] {
    const matched = collections.filter(items, (candidate: RegionalSenderSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalSenderSnapshots(store: RegionalSenderSnapshotStore, query: RegionalSenderSnapshotQuery): RegionalSenderSnapshot[] {
  return query.apply(store.list());
}

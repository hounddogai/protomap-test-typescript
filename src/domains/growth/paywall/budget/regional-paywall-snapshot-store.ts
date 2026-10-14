import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

/** Keeps regional paywall snapshots by code. */
export interface RegionalPaywallSnapshotStore {
  find(code: string): RegionalPaywallSnapshot | undefined;
  save(item: RegionalPaywallSnapshot): void;
  remove(code: string): boolean;
  list(): RegionalPaywallSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPaywallSnapshotStore implements RegionalPaywallSnapshotStore {
  items: Map<string, RegionalPaywallSnapshot>;
  order: string[];

  constructor(items: Map<string, RegionalPaywallSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPaywallSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPaywallSnapshot): void {
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

  list(): RegionalPaywallSnapshot[] {
    const out: RegionalPaywallSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPaywallSnapshotStore(): RegionalPaywallSnapshotStore {
  return new MemoryRegionalPaywallSnapshotStore(new Map<string, RegionalPaywallSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPaywallSnapshotStore implements RegionalPaywallSnapshotStore {
  inner: RegionalPaywallSnapshotStore;
  cache: cache.TtlCache<RegionalPaywallSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPaywallSnapshotStore,
    cacheValue: cache.TtlCache<RegionalPaywallSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPaywallSnapshot | undefined {
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

  save(item: RegionalPaywallSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPaywallSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPaywallSnapshotStore(inner: RegionalPaywallSnapshotStore, ttl: number, clockValue: clock.Clock): RegionalPaywallSnapshotStore {
  return new CachedRegionalPaywallSnapshotStore(
    inner,
    cache.newTtlCache<RegionalPaywallSnapshot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional paywall snapshots. Empty fields match all. */
export class RegionalPaywallSnapshotQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPaywallSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPaywallSnapshot[]): RegionalPaywallSnapshot[] {
    const matched = collections.filter(items, (candidate: RegionalPaywallSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPaywallSnapshots(store: RegionalPaywallSnapshotStore, query: RegionalPaywallSnapshotQuery): RegionalPaywallSnapshot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

/** Keeps strict paywall snapshots by code. */
export interface StrictPaywallSnapshotStore {
  find(code: string): StrictPaywallSnapshot | undefined;
  save(item: StrictPaywallSnapshot): void;
  remove(code: string): boolean;
  list(): StrictPaywallSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPaywallSnapshotStore implements StrictPaywallSnapshotStore {
  items: Map<string, StrictPaywallSnapshot>;
  order: string[];

  constructor(items: Map<string, StrictPaywallSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPaywallSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPaywallSnapshot): void {
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

  list(): StrictPaywallSnapshot[] {
    const out: StrictPaywallSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPaywallSnapshotStore(): StrictPaywallSnapshotStore {
  return new MemoryStrictPaywallSnapshotStore(new Map<string, StrictPaywallSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPaywallSnapshotStore implements StrictPaywallSnapshotStore {
  inner: StrictPaywallSnapshotStore;
  cache: cache.TtlCache<StrictPaywallSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPaywallSnapshotStore,
    cacheValue: cache.TtlCache<StrictPaywallSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPaywallSnapshot | undefined {
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

  save(item: StrictPaywallSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPaywallSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedStrictPaywallSnapshotStore(inner: StrictPaywallSnapshotStore, ttl: number, clockValue: clock.Clock): StrictPaywallSnapshotStore {
  return new CachedStrictPaywallSnapshotStore(
    inner,
    cache.newTtlCache<StrictPaywallSnapshot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict paywall snapshots. Empty fields match all. */
export class StrictPaywallSnapshotQuery {
  unit: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minImpressions: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPaywallSnapshot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPaywallSnapshot[]): StrictPaywallSnapshot[] {
    const matched = collections.filter(items, (candidate: StrictPaywallSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPaywallSnapshots(store: StrictPaywallSnapshotStore, query: StrictPaywallSnapshotQuery): StrictPaywallSnapshot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPaywallSnapshot } from "./weighted-paywall-snapshot.js";

/** Keeps weighted paywall snapshots by code. */
export interface WeightedPaywallSnapshotStore {
  find(code: string): WeightedPaywallSnapshot | undefined;
  save(item: WeightedPaywallSnapshot): void;
  remove(code: string): boolean;
  list(): WeightedPaywallSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPaywallSnapshotStore implements WeightedPaywallSnapshotStore {
  items: Map<string, WeightedPaywallSnapshot>;
  order: string[];

  constructor(items: Map<string, WeightedPaywallSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPaywallSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPaywallSnapshot): void {
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

  list(): WeightedPaywallSnapshot[] {
    const out: WeightedPaywallSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPaywallSnapshotStore(): WeightedPaywallSnapshotStore {
  return new MemoryWeightedPaywallSnapshotStore(new Map<string, WeightedPaywallSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPaywallSnapshotStore implements WeightedPaywallSnapshotStore {
  inner: WeightedPaywallSnapshotStore;
  cache: cache.TtlCache<WeightedPaywallSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPaywallSnapshotStore,
    cacheValue: cache.TtlCache<WeightedPaywallSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPaywallSnapshot | undefined {
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

  save(item: WeightedPaywallSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPaywallSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPaywallSnapshotStore(inner: WeightedPaywallSnapshotStore, ttl: number, clockValue: clock.Clock): WeightedPaywallSnapshotStore {
  return new CachedWeightedPaywallSnapshotStore(
    inner,
    cache.newTtlCache<WeightedPaywallSnapshot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted paywall snapshots. Empty fields match all. */
export class WeightedPaywallSnapshotQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPaywallSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPaywallSnapshot[]): WeightedPaywallSnapshot[] {
    const matched = collections.filter(items, (candidate: WeightedPaywallSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPaywallSnapshots(store: WeightedPaywallSnapshotStore, query: WeightedPaywallSnapshotQuery): WeightedPaywallSnapshot[] {
  return query.apply(store.list());
}

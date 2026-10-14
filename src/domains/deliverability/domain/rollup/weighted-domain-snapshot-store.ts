import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedDomainSnapshot } from "./weighted-domain-snapshot.js";

/** Keeps weighted domain snapshots by code. */
export interface WeightedDomainSnapshotStore {
  find(code: string): WeightedDomainSnapshot | undefined;
  save(item: WeightedDomainSnapshot): void;
  remove(code: string): boolean;
  list(): WeightedDomainSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedDomainSnapshotStore implements WeightedDomainSnapshotStore {
  items: Map<string, WeightedDomainSnapshot>;
  order: string[];

  constructor(items: Map<string, WeightedDomainSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedDomainSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedDomainSnapshot): void {
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

  list(): WeightedDomainSnapshot[] {
    const out: WeightedDomainSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedDomainSnapshotStore(): WeightedDomainSnapshotStore {
  return new MemoryWeightedDomainSnapshotStore(new Map<string, WeightedDomainSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedDomainSnapshotStore implements WeightedDomainSnapshotStore {
  inner: WeightedDomainSnapshotStore;
  cache: cache.TtlCache<WeightedDomainSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedDomainSnapshotStore,
    cacheValue: cache.TtlCache<WeightedDomainSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedDomainSnapshot | undefined {
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

  save(item: WeightedDomainSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedDomainSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedWeightedDomainSnapshotStore(inner: WeightedDomainSnapshotStore, ttl: number, clockValue: clock.Clock): WeightedDomainSnapshotStore {
  return new CachedWeightedDomainSnapshotStore(
    inner,
    cache.newTtlCache<WeightedDomainSnapshot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted domain snapshots. Empty fields match all. */
export class WeightedDomainSnapshotQuery {
  country: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minImpressions: number, statuses: string[], limit: number) {
    this.country = country;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedDomainSnapshot): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedDomainSnapshot[]): WeightedDomainSnapshot[] {
    const matched = collections.filter(items, (candidate: WeightedDomainSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedDomainSnapshots(store: WeightedDomainSnapshotStore, query: WeightedDomainSnapshotQuery): WeightedDomainSnapshot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTierRollup } from "./primary-tier-rollup.js";

/** Keeps primary tier rollups by code. */
export interface PrimaryTierRollupStore {
  find(code: string): PrimaryTierRollup | undefined;
  save(item: PrimaryTierRollup): void;
  remove(code: string): boolean;
  list(): PrimaryTierRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTierRollupStore implements PrimaryTierRollupStore {
  items: Map<string, PrimaryTierRollup>;
  order: string[];

  constructor(items: Map<string, PrimaryTierRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTierRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTierRollup): void {
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

  list(): PrimaryTierRollup[] {
    const out: PrimaryTierRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTierRollupStore(): PrimaryTierRollupStore {
  return new MemoryPrimaryTierRollupStore(new Map<string, PrimaryTierRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTierRollupStore implements PrimaryTierRollupStore {
  inner: PrimaryTierRollupStore;
  cache: cache.TtlCache<PrimaryTierRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTierRollupStore,
    cacheValue: cache.TtlCache<PrimaryTierRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTierRollup | undefined {
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

  save(item: PrimaryTierRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTierRollup[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTierRollupStore(inner: PrimaryTierRollupStore, ttl: number, clockValue: clock.Clock): PrimaryTierRollupStore {
  return new CachedPrimaryTierRollupStore(inner, cache.newTtlCache<PrimaryTierRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects primary tier rollups. Empty fields match all. */
export class PrimaryTierRollupQuery {
  region: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCapacity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTierRollup): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTierRollup[]): PrimaryTierRollup[] {
    const matched = collections.filter(items, (candidate: PrimaryTierRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTierRollups(store: PrimaryTierRollupStore, query: PrimaryTierRollupQuery): PrimaryTierRollup[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedDomainBundle } from "./weighted-domain-bundle.js";

/** Keeps weighted domain bundles by code. */
export interface WeightedDomainBundleStore {
  find(code: string): WeightedDomainBundle | undefined;
  save(item: WeightedDomainBundle): void;
  remove(code: string): boolean;
  list(): WeightedDomainBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedDomainBundleStore implements WeightedDomainBundleStore {
  items: Map<string, WeightedDomainBundle>;
  order: string[];

  constructor(items: Map<string, WeightedDomainBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedDomainBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedDomainBundle): void {
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

  list(): WeightedDomainBundle[] {
    const out: WeightedDomainBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedDomainBundleStore(): WeightedDomainBundleStore {
  return new MemoryWeightedDomainBundleStore(new Map<string, WeightedDomainBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedDomainBundleStore implements WeightedDomainBundleStore {
  inner: WeightedDomainBundleStore;
  cache: cache.TtlCache<WeightedDomainBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedDomainBundleStore,
    cacheValue: cache.TtlCache<WeightedDomainBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedDomainBundle | undefined {
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

  save(item: WeightedDomainBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedDomainBundle[] {
    return this.inner.list();
  }
}

export function newCachedWeightedDomainBundleStore(inner: WeightedDomainBundleStore, ttl: number, clockValue: clock.Clock): WeightedDomainBundleStore {
  return new CachedWeightedDomainBundleStore(
    inner,
    cache.newTtlCache<WeightedDomainBundle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted domain bundles. Empty fields match all. */
export class WeightedDomainBundleQuery {
  region: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAttempts: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedDomainBundle): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedDomainBundle[]): WeightedDomainBundle[] {
    const matched = collections.filter(items, (candidate: WeightedDomainBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedDomainBundles(store: WeightedDomainBundleStore, query: WeightedDomainBundleQuery): WeightedDomainBundle[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalReputationBundle } from "./regional-reputation-bundle.js";

/** Keeps regional reputation bundles by code. */
export interface RegionalReputationBundleStore {
  find(code: string): RegionalReputationBundle | undefined;
  save(item: RegionalReputationBundle): void;
  remove(code: string): boolean;
  list(): RegionalReputationBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalReputationBundleStore implements RegionalReputationBundleStore {
  items: Map<string, RegionalReputationBundle>;
  order: string[];

  constructor(items: Map<string, RegionalReputationBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalReputationBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalReputationBundle): void {
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

  list(): RegionalReputationBundle[] {
    const out: RegionalReputationBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalReputationBundleStore(): RegionalReputationBundleStore {
  return new MemoryRegionalReputationBundleStore(new Map<string, RegionalReputationBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalReputationBundleStore implements RegionalReputationBundleStore {
  inner: RegionalReputationBundleStore;
  cache: cache.TtlCache<RegionalReputationBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalReputationBundleStore,
    cacheValue: cache.TtlCache<RegionalReputationBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalReputationBundle | undefined {
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

  save(item: RegionalReputationBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalReputationBundle[] {
    return this.inner.list();
  }
}

export function newCachedRegionalReputationBundleStore(inner: RegionalReputationBundleStore, ttl: number, clockValue: clock.Clock): RegionalReputationBundleStore {
  return new CachedRegionalReputationBundleStore(
    inner,
    cache.newTtlCache<RegionalReputationBundle>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional reputation bundles. Empty fields match all. */
export class RegionalReputationBundleQuery {
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

  matches(item: RegionalReputationBundle): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalReputationBundle[]): RegionalReputationBundle[] {
    const matched = collections.filter(items, (candidate: RegionalReputationBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalReputationBundles(store: RegionalReputationBundleStore, query: RegionalReputationBundleQuery): RegionalReputationBundle[] {
  return query.apply(store.list());
}

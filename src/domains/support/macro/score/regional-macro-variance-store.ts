import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalMacroVariance } from "./regional-macro-variance.js";

/** Keeps regional macro variances by code. */
export interface RegionalMacroVarianceStore {
  find(code: string): RegionalMacroVariance | undefined;
  save(item: RegionalMacroVariance): void;
  remove(code: string): boolean;
  list(): RegionalMacroVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalMacroVarianceStore implements RegionalMacroVarianceStore {
  items: Map<string, RegionalMacroVariance>;
  order: string[];

  constructor(items: Map<string, RegionalMacroVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalMacroVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalMacroVariance): void {
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

  list(): RegionalMacroVariance[] {
    const out: RegionalMacroVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalMacroVarianceStore(): RegionalMacroVarianceStore {
  return new MemoryRegionalMacroVarianceStore(new Map<string, RegionalMacroVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalMacroVarianceStore implements RegionalMacroVarianceStore {
  inner: RegionalMacroVarianceStore;
  cache: cache.TtlCache<RegionalMacroVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalMacroVarianceStore,
    cacheValue: cache.TtlCache<RegionalMacroVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalMacroVariance | undefined {
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

  save(item: RegionalMacroVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalMacroVariance[] {
    return this.inner.list();
  }
}

export function newCachedRegionalMacroVarianceStore(inner: RegionalMacroVarianceStore, ttl: number, clockValue: clock.Clock): RegionalMacroVarianceStore {
  return new CachedRegionalMacroVarianceStore(
    inner,
    cache.newTtlCache<RegionalMacroVariance>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional macro variances. Empty fields match all. */
export class RegionalMacroVarianceQuery {
  region: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalMacroVariance): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalMacroVariance[]): RegionalMacroVariance[] {
    const matched = collections.filter(items, (candidate: RegionalMacroVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalMacroVariances(store: RegionalMacroVarianceStore, query: RegionalMacroVarianceQuery): RegionalMacroVariance[] {
  return query.apply(store.list());
}

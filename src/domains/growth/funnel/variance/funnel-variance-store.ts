import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelVariance } from "./funnel-variance.js";

/** Keeps funnel variances by code. */
export interface FunnelVarianceStore {
  find(code: string): FunnelVariance | undefined;
  save(item: FunnelVariance): void;
  remove(code: string): boolean;
  list(): FunnelVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelVarianceStore implements FunnelVarianceStore {
  items: Map<string, FunnelVariance>;
  order: string[];

  constructor(items: Map<string, FunnelVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelVariance): void {
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

  list(): FunnelVariance[] {
    const out: FunnelVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelVarianceStore(): FunnelVarianceStore {
  return new MemoryFunnelVarianceStore(new Map<string, FunnelVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelVarianceStore implements FunnelVarianceStore {
  inner: FunnelVarianceStore;
  cache: cache.TtlCache<FunnelVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelVarianceStore,
    cacheValue: cache.TtlCache<FunnelVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelVariance | undefined {
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

  save(item: FunnelVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelVariance[] {
    return this.inner.list();
  }
}

export function newCachedFunnelVarianceStore(inner: FunnelVarianceStore, ttl: number, clockValue: clock.Clock): FunnelVarianceStore {
  return new CachedFunnelVarianceStore(inner, cache.newTtlCache<FunnelVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects funnel variances. Empty fields match all. */
export class FunnelVarianceQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelVariance[]): FunnelVariance[] {
    const matched = collections.filter(items, (candidate: FunnelVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelVariances(store: FunnelVarianceStore, query: FunnelVarianceQuery): FunnelVariance[] {
  return query.apply(store.list());
}

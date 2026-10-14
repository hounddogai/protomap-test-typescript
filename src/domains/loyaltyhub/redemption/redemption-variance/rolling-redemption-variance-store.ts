import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingRedemptionVariance } from "./rolling-redemption-variance.js";

/** Keeps rolling redemption variances by code. */
export interface RollingRedemptionVarianceStore {
  find(code: string): RollingRedemptionVariance | undefined;
  save(item: RollingRedemptionVariance): void;
  remove(code: string): boolean;
  list(): RollingRedemptionVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingRedemptionVarianceStore implements RollingRedemptionVarianceStore {
  items: Map<string, RollingRedemptionVariance>;
  order: string[];

  constructor(items: Map<string, RollingRedemptionVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingRedemptionVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingRedemptionVariance): void {
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

  list(): RollingRedemptionVariance[] {
    const out: RollingRedemptionVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingRedemptionVarianceStore(): RollingRedemptionVarianceStore {
  return new MemoryRollingRedemptionVarianceStore(new Map<string, RollingRedemptionVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingRedemptionVarianceStore implements RollingRedemptionVarianceStore {
  inner: RollingRedemptionVarianceStore;
  cache: cache.TtlCache<RollingRedemptionVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingRedemptionVarianceStore,
    cacheValue: cache.TtlCache<RollingRedemptionVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingRedemptionVariance | undefined {
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

  save(item: RollingRedemptionVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingRedemptionVariance[] {
    return this.inner.list();
  }
}

export function newCachedRollingRedemptionVarianceStore(inner: RollingRedemptionVarianceStore, ttl: number, clockValue: clock.Clock): RollingRedemptionVarianceStore {
  return new CachedRollingRedemptionVarianceStore(
    inner,
    cache.newTtlCache<RollingRedemptionVariance>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling redemption variances. Empty fields match all. */
export class RollingRedemptionVarianceQuery {
  source: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minVersion: number, statuses: string[], limit: number) {
    this.source = source;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingRedemptionVariance): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingRedemptionVariance[]): RollingRedemptionVariance[] {
    const matched = collections.filter(items, (candidate: RollingRedemptionVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingRedemptionVariances(store: RollingRedemptionVarianceStore, query: RollingRedemptionVarianceQuery): RollingRedemptionVariance[] {
  return query.apply(store.list());
}

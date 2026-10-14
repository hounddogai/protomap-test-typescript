import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInQuota } from "./double-opt-in-quota.js";

/** Keeps double opt in quotas by code. */
export interface DoubleOptInQuotaStore {
  find(code: string): DoubleOptInQuota | undefined;
  save(item: DoubleOptInQuota): void;
  remove(code: string): boolean;
  list(): DoubleOptInQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInQuotaStore implements DoubleOptInQuotaStore {
  items: Map<string, DoubleOptInQuota>;
  order: string[];

  constructor(items: Map<string, DoubleOptInQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInQuota): void {
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

  list(): DoubleOptInQuota[] {
    const out: DoubleOptInQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInQuotaStore(): DoubleOptInQuotaStore {
  return new MemoryDoubleOptInQuotaStore(new Map<string, DoubleOptInQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInQuotaStore implements DoubleOptInQuotaStore {
  inner: DoubleOptInQuotaStore;
  cache: cache.TtlCache<DoubleOptInQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInQuotaStore,
    cacheValue: cache.TtlCache<DoubleOptInQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInQuota | undefined {
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

  save(item: DoubleOptInQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInQuota[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInQuotaStore(inner: DoubleOptInQuotaStore, ttl: number, clockValue: clock.Clock): DoubleOptInQuotaStore {
  return new CachedDoubleOptInQuotaStore(inner, cache.newTtlCache<DoubleOptInQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects double opt in quotas. Empty fields match all. */
export class DoubleOptInQuotaQuery {
  unit: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCapacity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInQuota): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInQuota[]): DoubleOptInQuota[] {
    const matched = collections.filter(items, (candidate: DoubleOptInQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInQuotas(store: DoubleOptInQuotaStore, query: DoubleOptInQuotaQuery): DoubleOptInQuota[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPathQuota } from "./weighted-path-quota.js";

/** Keeps weighted path quotas by code. */
export interface WeightedPathQuotaStore {
  find(code: string): WeightedPathQuota | undefined;
  save(item: WeightedPathQuota): void;
  remove(code: string): boolean;
  list(): WeightedPathQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPathQuotaStore implements WeightedPathQuotaStore {
  items: Map<string, WeightedPathQuota>;
  order: string[];

  constructor(items: Map<string, WeightedPathQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPathQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPathQuota): void {
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

  list(): WeightedPathQuota[] {
    const out: WeightedPathQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPathQuotaStore(): WeightedPathQuotaStore {
  return new MemoryWeightedPathQuotaStore(new Map<string, WeightedPathQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPathQuotaStore implements WeightedPathQuotaStore {
  inner: WeightedPathQuotaStore;
  cache: cache.TtlCache<WeightedPathQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPathQuotaStore,
    cacheValue: cache.TtlCache<WeightedPathQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPathQuota | undefined {
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

  save(item: WeightedPathQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPathQuota[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPathQuotaStore(inner: WeightedPathQuotaStore, ttl: number, clockValue: clock.Clock): WeightedPathQuotaStore {
  return new CachedWeightedPathQuotaStore(inner, cache.newTtlCache<WeightedPathQuota>(512, ttl, clockValue), 0, 0);
}

/** Selects weighted path quotas. Empty fields match all. */
export class WeightedPathQuotaQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPathQuota): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPathQuota[]): WeightedPathQuota[] {
    const matched = collections.filter(items, (candidate: WeightedPathQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPathQuotas(store: WeightedPathQuotaStore, query: WeightedPathQuotaQuery): WeightedPathQuota[] {
  return query.apply(store.list());
}

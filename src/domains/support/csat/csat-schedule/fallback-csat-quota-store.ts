import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCsatQuota } from "./fallback-csat-quota.js";

/** Keeps fallback csat quotas by code. */
export interface FallbackCsatQuotaStore {
  find(code: string): FallbackCsatQuota | undefined;
  save(item: FallbackCsatQuota): void;
  remove(code: string): boolean;
  list(): FallbackCsatQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCsatQuotaStore implements FallbackCsatQuotaStore {
  items: Map<string, FallbackCsatQuota>;
  order: string[];

  constructor(items: Map<string, FallbackCsatQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCsatQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCsatQuota): void {
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

  list(): FallbackCsatQuota[] {
    const out: FallbackCsatQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCsatQuotaStore(): FallbackCsatQuotaStore {
  return new MemoryFallbackCsatQuotaStore(new Map<string, FallbackCsatQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCsatQuotaStore implements FallbackCsatQuotaStore {
  inner: FallbackCsatQuotaStore;
  cache: cache.TtlCache<FallbackCsatQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCsatQuotaStore,
    cacheValue: cache.TtlCache<FallbackCsatQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCsatQuota | undefined {
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

  save(item: FallbackCsatQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCsatQuota[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCsatQuotaStore(inner: FallbackCsatQuotaStore, ttl: number, clockValue: clock.Clock): FallbackCsatQuotaStore {
  return new CachedFallbackCsatQuotaStore(inner, cache.newTtlCache<FallbackCsatQuota>(1024, ttl, clockValue), 0, 0);
}

/** Selects fallback csat quotas. Empty fields match all. */
export class FallbackCsatQuotaQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCsatQuota): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCsatQuota[]): FallbackCsatQuota[] {
    const matched = collections.filter(items, (candidate: FallbackCsatQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCsatQuotas(store: FallbackCsatQuotaStore, query: FallbackCsatQuotaQuery): FallbackCsatQuota[] {
  return query.apply(store.list());
}

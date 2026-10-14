import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupQuota } from "./warmup-quota.js";

/** Keeps warmup quotas by code. */
export interface WarmupQuotaStore {
  find(code: string): WarmupQuota | undefined;
  save(item: WarmupQuota): void;
  remove(code: string): boolean;
  list(): WarmupQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupQuotaStore implements WarmupQuotaStore {
  items: Map<string, WarmupQuota>;
  order: string[];

  constructor(items: Map<string, WarmupQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupQuota): void {
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

  list(): WarmupQuota[] {
    const out: WarmupQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupQuotaStore(): WarmupQuotaStore {
  return new MemoryWarmupQuotaStore(new Map<string, WarmupQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupQuotaStore implements WarmupQuotaStore {
  inner: WarmupQuotaStore;
  cache: cache.TtlCache<WarmupQuota>;
  hits: number;
  misses: number;

  constructor(inner: WarmupQuotaStore, cacheValue: cache.TtlCache<WarmupQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupQuota | undefined {
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

  save(item: WarmupQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupQuota[] {
    return this.inner.list();
  }
}

export function newCachedWarmupQuotaStore(inner: WarmupQuotaStore, ttl: number, clockValue: clock.Clock): WarmupQuotaStore {
  return new CachedWarmupQuotaStore(inner, cache.newTtlCache<WarmupQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects warmup quotas. Empty fields match all. */
export class WarmupQuotaQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupQuota): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupQuota[]): WarmupQuota[] {
    const matched = collections.filter(items, (candidate: WarmupQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupQuotas(store: WarmupQuotaStore, query: WarmupQuotaQuery): WarmupQuota[] {
  return query.apply(store.list());
}

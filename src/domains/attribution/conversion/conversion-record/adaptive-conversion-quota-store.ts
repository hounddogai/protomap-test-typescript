import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveConversionQuota } from "./adaptive-conversion-quota.js";

/** Keeps adaptive conversion quotas by code. */
export interface AdaptiveConversionQuotaStore {
  find(code: string): AdaptiveConversionQuota | undefined;
  save(item: AdaptiveConversionQuota): void;
  remove(code: string): boolean;
  list(): AdaptiveConversionQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveConversionQuotaStore implements AdaptiveConversionQuotaStore {
  items: Map<string, AdaptiveConversionQuota>;
  order: string[];

  constructor(items: Map<string, AdaptiveConversionQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveConversionQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveConversionQuota): void {
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

  list(): AdaptiveConversionQuota[] {
    const out: AdaptiveConversionQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveConversionQuotaStore(): AdaptiveConversionQuotaStore {
  return new MemoryAdaptiveConversionQuotaStore(new Map<string, AdaptiveConversionQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveConversionQuotaStore implements AdaptiveConversionQuotaStore {
  inner: AdaptiveConversionQuotaStore;
  cache: cache.TtlCache<AdaptiveConversionQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveConversionQuotaStore,
    cacheValue: cache.TtlCache<AdaptiveConversionQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveConversionQuota | undefined {
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

  save(item: AdaptiveConversionQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveConversionQuota[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveConversionQuotaStore(inner: AdaptiveConversionQuotaStore, ttl: number, clockValue: clock.Clock): AdaptiveConversionQuotaStore {
  return new CachedAdaptiveConversionQuotaStore(
    inner,
    cache.newTtlCache<AdaptiveConversionQuota>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive conversion quotas. Empty fields match all. */
export class AdaptiveConversionQuotaQuery {
  source: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minSendAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveConversionQuota): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveConversionQuota[]): AdaptiveConversionQuota[] {
    const matched = collections.filter(items, (candidate: AdaptiveConversionQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveConversionQuotas(store: AdaptiveConversionQuotaStore, query: AdaptiveConversionQuotaQuery): AdaptiveConversionQuota[] {
  return query.apply(store.list());
}

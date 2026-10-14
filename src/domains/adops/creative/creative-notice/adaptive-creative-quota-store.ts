import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCreativeQuota } from "./adaptive-creative-quota.js";

/** Keeps adaptive creative quotas by code. */
export interface AdaptiveCreativeQuotaStore {
  find(code: string): AdaptiveCreativeQuota | undefined;
  save(item: AdaptiveCreativeQuota): void;
  remove(code: string): boolean;
  list(): AdaptiveCreativeQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCreativeQuotaStore implements AdaptiveCreativeQuotaStore {
  items: Map<string, AdaptiveCreativeQuota>;
  order: string[];

  constructor(items: Map<string, AdaptiveCreativeQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCreativeQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCreativeQuota): void {
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

  list(): AdaptiveCreativeQuota[] {
    const out: AdaptiveCreativeQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCreativeQuotaStore(): AdaptiveCreativeQuotaStore {
  return new MemoryAdaptiveCreativeQuotaStore(new Map<string, AdaptiveCreativeQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCreativeQuotaStore implements AdaptiveCreativeQuotaStore {
  inner: AdaptiveCreativeQuotaStore;
  cache: cache.TtlCache<AdaptiveCreativeQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCreativeQuotaStore,
    cacheValue: cache.TtlCache<AdaptiveCreativeQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCreativeQuota | undefined {
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

  save(item: AdaptiveCreativeQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCreativeQuota[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCreativeQuotaStore(inner: AdaptiveCreativeQuotaStore, ttl: number, clockValue: clock.Clock): AdaptiveCreativeQuotaStore {
  return new CachedAdaptiveCreativeQuotaStore(
    inner,
    cache.newTtlCache<AdaptiveCreativeQuota>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive creative quotas. Empty fields match all. */
export class AdaptiveCreativeQuotaQuery {
  region: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minSequence: number, statuses: string[], limit: number) {
    this.region = region;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCreativeQuota): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCreativeQuota[]): AdaptiveCreativeQuota[] {
    const matched = collections.filter(items, (candidate: AdaptiveCreativeQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCreativeQuotas(store: AdaptiveCreativeQuotaStore, query: AdaptiveCreativeQuotaQuery): AdaptiveCreativeQuota[] {
  return query.apply(store.list());
}

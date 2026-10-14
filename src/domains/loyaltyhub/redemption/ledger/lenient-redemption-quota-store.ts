import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRedemptionQuota } from "./lenient-redemption-quota.js";

/** Keeps lenient redemption quotas by code. */
export interface LenientRedemptionQuotaStore {
  find(code: string): LenientRedemptionQuota | undefined;
  save(item: LenientRedemptionQuota): void;
  remove(code: string): boolean;
  list(): LenientRedemptionQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRedemptionQuotaStore implements LenientRedemptionQuotaStore {
  items: Map<string, LenientRedemptionQuota>;
  order: string[];

  constructor(items: Map<string, LenientRedemptionQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRedemptionQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRedemptionQuota): void {
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

  list(): LenientRedemptionQuota[] {
    const out: LenientRedemptionQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRedemptionQuotaStore(): LenientRedemptionQuotaStore {
  return new MemoryLenientRedemptionQuotaStore(new Map<string, LenientRedemptionQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRedemptionQuotaStore implements LenientRedemptionQuotaStore {
  inner: LenientRedemptionQuotaStore;
  cache: cache.TtlCache<LenientRedemptionQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRedemptionQuotaStore,
    cacheValue: cache.TtlCache<LenientRedemptionQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRedemptionQuota | undefined {
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

  save(item: LenientRedemptionQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRedemptionQuota[] {
    return this.inner.list();
  }
}

export function newCachedLenientRedemptionQuotaStore(inner: LenientRedemptionQuotaStore, ttl: number, clockValue: clock.Clock): LenientRedemptionQuotaStore {
  return new CachedLenientRedemptionQuotaStore(
    inner,
    cache.newTtlCache<LenientRedemptionQuota>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient redemption quotas. Empty fields match all. */
export class LenientRedemptionQuotaQuery {
  source: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMaximum: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRedemptionQuota): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRedemptionQuota[]): LenientRedemptionQuota[] {
    const matched = collections.filter(items, (candidate: LenientRedemptionQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRedemptionQuotas(store: LenientRedemptionQuotaStore, query: LenientRedemptionQuotaQuery): LenientRedemptionQuota[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPayoutQuota } from "./strict-payout-quota.js";

/** Keeps strict payout quotas by code. */
export interface StrictPayoutQuotaStore {
  find(code: string): StrictPayoutQuota | undefined;
  save(item: StrictPayoutQuota): void;
  remove(code: string): boolean;
  list(): StrictPayoutQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPayoutQuotaStore implements StrictPayoutQuotaStore {
  items: Map<string, StrictPayoutQuota>;
  order: string[];

  constructor(items: Map<string, StrictPayoutQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPayoutQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPayoutQuota): void {
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

  list(): StrictPayoutQuota[] {
    const out: StrictPayoutQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPayoutQuotaStore(): StrictPayoutQuotaStore {
  return new MemoryStrictPayoutQuotaStore(new Map<string, StrictPayoutQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPayoutQuotaStore implements StrictPayoutQuotaStore {
  inner: StrictPayoutQuotaStore;
  cache: cache.TtlCache<StrictPayoutQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPayoutQuotaStore,
    cacheValue: cache.TtlCache<StrictPayoutQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPayoutQuota | undefined {
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

  save(item: StrictPayoutQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPayoutQuota[] {
    return this.inner.list();
  }
}

export function newCachedStrictPayoutQuotaStore(inner: StrictPayoutQuotaStore, ttl: number, clockValue: clock.Clock): StrictPayoutQuotaStore {
  return new CachedStrictPayoutQuotaStore(inner, cache.newTtlCache<StrictPayoutQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects strict payout quotas. Empty fields match all. */
export class StrictPayoutQuotaQuery {
  locale: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCeiling: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPayoutQuota): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPayoutQuota[]): StrictPayoutQuota[] {
    const matched = collections.filter(items, (candidate: StrictPayoutQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPayoutQuotas(store: StrictPayoutQuotaStore, query: StrictPayoutQuotaQuery): StrictPayoutQuota[] {
  return query.apply(store.list());
}

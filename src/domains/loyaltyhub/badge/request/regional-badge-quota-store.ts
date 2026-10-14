import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalBadgeQuota } from "./regional-badge-quota.js";

/** Keeps regional badge quotas by code. */
export interface RegionalBadgeQuotaStore {
  find(code: string): RegionalBadgeQuota | undefined;
  save(item: RegionalBadgeQuota): void;
  remove(code: string): boolean;
  list(): RegionalBadgeQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalBadgeQuotaStore implements RegionalBadgeQuotaStore {
  items: Map<string, RegionalBadgeQuota>;
  order: string[];

  constructor(items: Map<string, RegionalBadgeQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalBadgeQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalBadgeQuota): void {
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

  list(): RegionalBadgeQuota[] {
    const out: RegionalBadgeQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalBadgeQuotaStore(): RegionalBadgeQuotaStore {
  return new MemoryRegionalBadgeQuotaStore(new Map<string, RegionalBadgeQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalBadgeQuotaStore implements RegionalBadgeQuotaStore {
  inner: RegionalBadgeQuotaStore;
  cache: cache.TtlCache<RegionalBadgeQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalBadgeQuotaStore,
    cacheValue: cache.TtlCache<RegionalBadgeQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalBadgeQuota | undefined {
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

  save(item: RegionalBadgeQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalBadgeQuota[] {
    return this.inner.list();
  }
}

export function newCachedRegionalBadgeQuotaStore(inner: RegionalBadgeQuotaStore, ttl: number, clockValue: clock.Clock): RegionalBadgeQuotaStore {
  return new CachedRegionalBadgeQuotaStore(inner, cache.newTtlCache<RegionalBadgeQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects regional badge quotas. Empty fields match all. */
export class RegionalBadgeQuotaQuery {
  locale: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWeight: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalBadgeQuota): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalBadgeQuota[]): RegionalBadgeQuota[] {
    const matched = collections.filter(items, (candidate: RegionalBadgeQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalBadgeQuotas(store: RegionalBadgeQuotaStore, query: RegionalBadgeQuotaQuery): RegionalBadgeQuota[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalCohortQuota } from "./global-cohort-quota.js";

/** Keeps global cohort quotas by code. */
export interface GlobalCohortQuotaStore {
  find(code: string): GlobalCohortQuota | undefined;
  save(item: GlobalCohortQuota): void;
  remove(code: string): boolean;
  list(): GlobalCohortQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalCohortQuotaStore implements GlobalCohortQuotaStore {
  items: Map<string, GlobalCohortQuota>;
  order: string[];

  constructor(items: Map<string, GlobalCohortQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalCohortQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalCohortQuota): void {
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

  list(): GlobalCohortQuota[] {
    const out: GlobalCohortQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalCohortQuotaStore(): GlobalCohortQuotaStore {
  return new MemoryGlobalCohortQuotaStore(new Map<string, GlobalCohortQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalCohortQuotaStore implements GlobalCohortQuotaStore {
  inner: GlobalCohortQuotaStore;
  cache: cache.TtlCache<GlobalCohortQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalCohortQuotaStore,
    cacheValue: cache.TtlCache<GlobalCohortQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalCohortQuota | undefined {
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

  save(item: GlobalCohortQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalCohortQuota[] {
    return this.inner.list();
  }
}

export function newCachedGlobalCohortQuotaStore(inner: GlobalCohortQuotaStore, ttl: number, clockValue: clock.Clock): GlobalCohortQuotaStore {
  return new CachedGlobalCohortQuotaStore(inner, cache.newTtlCache<GlobalCohortQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects global cohort quotas. Empty fields match all. */
export class GlobalCohortQuotaQuery {
  locale: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMinimum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalCohortQuota): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalCohortQuota[]): GlobalCohortQuota[] {
    const matched = collections.filter(items, (candidate: GlobalCohortQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalCohortQuotas(store: GlobalCohortQuotaStore, query: GlobalCohortQuotaQuery): GlobalCohortQuota[] {
  return query.apply(store.list());
}

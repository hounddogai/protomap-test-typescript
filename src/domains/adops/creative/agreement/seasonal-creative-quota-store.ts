import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCreativeQuota } from "./seasonal-creative-quota.js";

/** Keeps seasonal creative quotas by code. */
export interface SeasonalCreativeQuotaStore {
  find(code: string): SeasonalCreativeQuota | undefined;
  save(item: SeasonalCreativeQuota): void;
  remove(code: string): boolean;
  list(): SeasonalCreativeQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCreativeQuotaStore implements SeasonalCreativeQuotaStore {
  items: Map<string, SeasonalCreativeQuota>;
  order: string[];

  constructor(items: Map<string, SeasonalCreativeQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCreativeQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCreativeQuota): void {
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

  list(): SeasonalCreativeQuota[] {
    const out: SeasonalCreativeQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCreativeQuotaStore(): SeasonalCreativeQuotaStore {
  return new MemorySeasonalCreativeQuotaStore(new Map<string, SeasonalCreativeQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCreativeQuotaStore implements SeasonalCreativeQuotaStore {
  inner: SeasonalCreativeQuotaStore;
  cache: cache.TtlCache<SeasonalCreativeQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCreativeQuotaStore,
    cacheValue: cache.TtlCache<SeasonalCreativeQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCreativeQuota | undefined {
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

  save(item: SeasonalCreativeQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCreativeQuota[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCreativeQuotaStore(inner: SeasonalCreativeQuotaStore, ttl: number, clockValue: clock.Clock): SeasonalCreativeQuotaStore {
  return new CachedSeasonalCreativeQuotaStore(
    inner,
    cache.newTtlCache<SeasonalCreativeQuota>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal creative quotas. Empty fields match all. */
export class SeasonalCreativeQuotaQuery {
  label: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWindowDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCreativeQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCreativeQuota[]): SeasonalCreativeQuota[] {
    const matched = collections.filter(items, (candidate: SeasonalCreativeQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCreativeQuotas(store: SeasonalCreativeQuotaStore, query: SeasonalCreativeQuotaQuery): SeasonalCreativeQuota[] {
  return query.apply(store.list());
}

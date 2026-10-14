import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalChallengeQuota } from "./seasonal-challenge-quota.js";

/** Keeps seasonal challenge quotas by code. */
export interface SeasonalChallengeQuotaStore {
  find(code: string): SeasonalChallengeQuota | undefined;
  save(item: SeasonalChallengeQuota): void;
  remove(code: string): boolean;
  list(): SeasonalChallengeQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalChallengeQuotaStore implements SeasonalChallengeQuotaStore {
  items: Map<string, SeasonalChallengeQuota>;
  order: string[];

  constructor(items: Map<string, SeasonalChallengeQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalChallengeQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalChallengeQuota): void {
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

  list(): SeasonalChallengeQuota[] {
    const out: SeasonalChallengeQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalChallengeQuotaStore(): SeasonalChallengeQuotaStore {
  return new MemorySeasonalChallengeQuotaStore(new Map<string, SeasonalChallengeQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalChallengeQuotaStore implements SeasonalChallengeQuotaStore {
  inner: SeasonalChallengeQuotaStore;
  cache: cache.TtlCache<SeasonalChallengeQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalChallengeQuotaStore,
    cacheValue: cache.TtlCache<SeasonalChallengeQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalChallengeQuota | undefined {
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

  save(item: SeasonalChallengeQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalChallengeQuota[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalChallengeQuotaStore(inner: SeasonalChallengeQuotaStore, ttl: number, clockValue: clock.Clock): SeasonalChallengeQuotaStore {
  return new CachedSeasonalChallengeQuotaStore(
    inner,
    cache.newTtlCache<SeasonalChallengeQuota>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal challenge quotas. Empty fields match all. */
export class SeasonalChallengeQuotaQuery {
  country: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalChallengeQuota): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalChallengeQuota[]): SeasonalChallengeQuota[] {
    const matched = collections.filter(items, (candidate: SeasonalChallengeQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalChallengeQuotas(store: SeasonalChallengeQuotaStore, query: SeasonalChallengeQuotaQuery): SeasonalChallengeQuota[] {
  return query.apply(store.list());
}

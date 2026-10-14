import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

/** Keeps seasonal suppression tiers by code. */
export interface SeasonalSuppressionTierStore {
  find(code: string): SeasonalSuppressionTier | undefined;
  save(item: SeasonalSuppressionTier): void;
  remove(code: string): boolean;
  list(): SeasonalSuppressionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalSuppressionTierStore implements SeasonalSuppressionTierStore {
  items: Map<string, SeasonalSuppressionTier>;
  order: string[];

  constructor(items: Map<string, SeasonalSuppressionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalSuppressionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalSuppressionTier): void {
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

  list(): SeasonalSuppressionTier[] {
    const out: SeasonalSuppressionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalSuppressionTierStore(): SeasonalSuppressionTierStore {
  return new MemorySeasonalSuppressionTierStore(new Map<string, SeasonalSuppressionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalSuppressionTierStore implements SeasonalSuppressionTierStore {
  inner: SeasonalSuppressionTierStore;
  cache: cache.TtlCache<SeasonalSuppressionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalSuppressionTierStore,
    cacheValue: cache.TtlCache<SeasonalSuppressionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalSuppressionTier | undefined {
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

  save(item: SeasonalSuppressionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalSuppressionTier[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalSuppressionTierStore(inner: SeasonalSuppressionTierStore, ttl: number, clockValue: clock.Clock): SeasonalSuppressionTierStore {
  return new CachedSeasonalSuppressionTierStore(
    inner,
    cache.newTtlCache<SeasonalSuppressionTier>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal suppression tiers. Empty fields match all. */
export class SeasonalSuppressionTierQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalSuppressionTier): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalSuppressionTier[]): SeasonalSuppressionTier[] {
    const matched = collections.filter(items, (candidate: SeasonalSuppressionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalSuppressionTiers(store: SeasonalSuppressionTierStore, query: SeasonalSuppressionTierQuery): SeasonalSuppressionTier[] {
  return query.apply(store.list());
}

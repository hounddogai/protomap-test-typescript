import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalActivationTier } from "./seasonal-activation-tier.js";

/** Keeps seasonal activation tiers by code. */
export interface SeasonalActivationTierStore {
  find(code: string): SeasonalActivationTier | undefined;
  save(item: SeasonalActivationTier): void;
  remove(code: string): boolean;
  list(): SeasonalActivationTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalActivationTierStore implements SeasonalActivationTierStore {
  items: Map<string, SeasonalActivationTier>;
  order: string[];

  constructor(items: Map<string, SeasonalActivationTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalActivationTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalActivationTier): void {
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

  list(): SeasonalActivationTier[] {
    const out: SeasonalActivationTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalActivationTierStore(): SeasonalActivationTierStore {
  return new MemorySeasonalActivationTierStore(new Map<string, SeasonalActivationTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalActivationTierStore implements SeasonalActivationTierStore {
  inner: SeasonalActivationTierStore;
  cache: cache.TtlCache<SeasonalActivationTier>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalActivationTierStore,
    cacheValue: cache.TtlCache<SeasonalActivationTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalActivationTier | undefined {
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

  save(item: SeasonalActivationTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalActivationTier[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalActivationTierStore(inner: SeasonalActivationTierStore, ttl: number, clockValue: clock.Clock): SeasonalActivationTierStore {
  return new CachedSeasonalActivationTierStore(
    inner,
    cache.newTtlCache<SeasonalActivationTier>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal activation tiers. Empty fields match all. */
export class SeasonalActivationTierQuery {
  category: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minScore: number, statuses: string[], limit: number) {
    this.category = category;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalActivationTier): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalActivationTier[]): SeasonalActivationTier[] {
    const matched = collections.filter(items, (candidate: SeasonalActivationTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalActivationTiers(store: SeasonalActivationTierStore, query: SeasonalActivationTierQuery): SeasonalActivationTier[] {
  return query.apply(store.list());
}

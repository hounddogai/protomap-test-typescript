import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveStreakTier } from "./adaptive-streak-tier.js";

/** Keeps adaptive streak tiers by code. */
export interface AdaptiveStreakTierStore {
  find(code: string): AdaptiveStreakTier | undefined;
  save(item: AdaptiveStreakTier): void;
  remove(code: string): boolean;
  list(): AdaptiveStreakTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveStreakTierStore implements AdaptiveStreakTierStore {
  items: Map<string, AdaptiveStreakTier>;
  order: string[];

  constructor(items: Map<string, AdaptiveStreakTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveStreakTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveStreakTier): void {
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

  list(): AdaptiveStreakTier[] {
    const out: AdaptiveStreakTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveStreakTierStore(): AdaptiveStreakTierStore {
  return new MemoryAdaptiveStreakTierStore(new Map<string, AdaptiveStreakTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveStreakTierStore implements AdaptiveStreakTierStore {
  inner: AdaptiveStreakTierStore;
  cache: cache.TtlCache<AdaptiveStreakTier>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveStreakTierStore,
    cacheValue: cache.TtlCache<AdaptiveStreakTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveStreakTier | undefined {
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

  save(item: AdaptiveStreakTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveStreakTier[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveStreakTierStore(inner: AdaptiveStreakTierStore, ttl: number, clockValue: clock.Clock): AdaptiveStreakTierStore {
  return new CachedAdaptiveStreakTierStore(inner, cache.newTtlCache<AdaptiveStreakTier>(256, ttl, clockValue), 0, 0);
}

/** Selects adaptive streak tiers. Empty fields match all. */
export class AdaptiveStreakTierQuery {
  channel: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMinimum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveStreakTier): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveStreakTier[]): AdaptiveStreakTier[] {
    const matched = collections.filter(items, (candidate: AdaptiveStreakTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveStreakTiers(store: AdaptiveStreakTierStore, query: AdaptiveStreakTierQuery): AdaptiveStreakTier[] {
  return query.apply(store.list());
}

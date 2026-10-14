import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupTier } from "./warmup-tier.js";

/** Keeps warmup tiers by code. */
export interface WarmupTierStore {
  find(code: string): WarmupTier | undefined;
  save(item: WarmupTier): void;
  remove(code: string): boolean;
  list(): WarmupTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupTierStore implements WarmupTierStore {
  items: Map<string, WarmupTier>;
  order: string[];

  constructor(items: Map<string, WarmupTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupTier): void {
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

  list(): WarmupTier[] {
    const out: WarmupTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupTierStore(): WarmupTierStore {
  return new MemoryWarmupTierStore(new Map<string, WarmupTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupTierStore implements WarmupTierStore {
  inner: WarmupTierStore;
  cache: cache.TtlCache<WarmupTier>;
  hits: number;
  misses: number;

  constructor(inner: WarmupTierStore, cacheValue: cache.TtlCache<WarmupTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupTier | undefined {
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

  save(item: WarmupTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupTier[] {
    return this.inner.list();
  }
}

export function newCachedWarmupTierStore(inner: WarmupTierStore, ttl: number, clockValue: clock.Clock): WarmupTierStore {
  return new CachedWarmupTierStore(inner, cache.newTtlCache<WarmupTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects warmup tiers. Empty fields match all. */
export class WarmupTierQuery {
  country: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMinimum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupTier): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupTier[]): WarmupTier[] {
    const matched = collections.filter(items, (candidate: WarmupTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupTiers(store: WarmupTierStore, query: WarmupTierQuery): WarmupTier[] {
  return query.apply(store.list());
}

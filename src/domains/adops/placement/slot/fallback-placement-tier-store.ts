import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPlacementTier } from "./fallback-placement-tier.js";

/** Keeps fallback placement tiers by code. */
export interface FallbackPlacementTierStore {
  find(code: string): FallbackPlacementTier | undefined;
  save(item: FallbackPlacementTier): void;
  remove(code: string): boolean;
  list(): FallbackPlacementTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPlacementTierStore implements FallbackPlacementTierStore {
  items: Map<string, FallbackPlacementTier>;
  order: string[];

  constructor(items: Map<string, FallbackPlacementTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPlacementTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPlacementTier): void {
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

  list(): FallbackPlacementTier[] {
    const out: FallbackPlacementTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPlacementTierStore(): FallbackPlacementTierStore {
  return new MemoryFallbackPlacementTierStore(new Map<string, FallbackPlacementTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPlacementTierStore implements FallbackPlacementTierStore {
  inner: FallbackPlacementTierStore;
  cache: cache.TtlCache<FallbackPlacementTier>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPlacementTierStore,
    cacheValue: cache.TtlCache<FallbackPlacementTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPlacementTier | undefined {
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

  save(item: FallbackPlacementTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPlacementTier[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPlacementTierStore(inner: FallbackPlacementTierStore, ttl: number, clockValue: clock.Clock): FallbackPlacementTierStore {
  return new CachedFallbackPlacementTierStore(
    inner,
    cache.newTtlCache<FallbackPlacementTier>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback placement tiers. Empty fields match all. */
export class FallbackPlacementTierQuery {
  utmSource: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMaximum: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPlacementTier): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPlacementTier[]): FallbackPlacementTier[] {
    const matched = collections.filter(items, (candidate: FallbackPlacementTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPlacementTiers(store: FallbackPlacementTierStore, query: FallbackPlacementTierQuery): FallbackPlacementTier[] {
  return query.apply(store.list());
}

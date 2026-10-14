import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredDeflectionTier } from "./tiered-deflection-tier.js";

/** Keeps tiered deflection tiers by code. */
export interface TieredDeflectionTierStore {
  find(code: string): TieredDeflectionTier | undefined;
  save(item: TieredDeflectionTier): void;
  remove(code: string): boolean;
  list(): TieredDeflectionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredDeflectionTierStore implements TieredDeflectionTierStore {
  items: Map<string, TieredDeflectionTier>;
  order: string[];

  constructor(items: Map<string, TieredDeflectionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredDeflectionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredDeflectionTier): void {
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

  list(): TieredDeflectionTier[] {
    const out: TieredDeflectionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredDeflectionTierStore(): TieredDeflectionTierStore {
  return new MemoryTieredDeflectionTierStore(new Map<string, TieredDeflectionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredDeflectionTierStore implements TieredDeflectionTierStore {
  inner: TieredDeflectionTierStore;
  cache: cache.TtlCache<TieredDeflectionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredDeflectionTierStore,
    cacheValue: cache.TtlCache<TieredDeflectionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredDeflectionTier | undefined {
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

  save(item: TieredDeflectionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredDeflectionTier[] {
    return this.inner.list();
  }
}

export function newCachedTieredDeflectionTierStore(inner: TieredDeflectionTierStore, ttl: number, clockValue: clock.Clock): TieredDeflectionTierStore {
  return new CachedTieredDeflectionTierStore(
    inner,
    cache.newTtlCache<TieredDeflectionTier>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered deflection tiers. Empty fields match all. */
export class TieredDeflectionTierQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredDeflectionTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredDeflectionTier[]): TieredDeflectionTier[] {
    const matched = collections.filter(items, (candidate: TieredDeflectionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredDeflectionTiers(store: TieredDeflectionTierStore, query: TieredDeflectionTierQuery): TieredDeflectionTier[] {
  return query.apply(store.list());
}

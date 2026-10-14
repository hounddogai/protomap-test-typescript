import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierRollup } from "./tier-rollup.js";

/** Keeps tier rollups by code. */
export interface TierRollupStore {
  find(code: string): TierRollup | undefined;
  save(item: TierRollup): void;
  remove(code: string): boolean;
  list(): TierRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierRollupStore implements TierRollupStore {
  items: Map<string, TierRollup>;
  order: string[];

  constructor(items: Map<string, TierRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierRollup): void {
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

  list(): TierRollup[] {
    const out: TierRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierRollupStore(): TierRollupStore {
  return new MemoryTierRollupStore(new Map<string, TierRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierRollupStore implements TierRollupStore {
  inner: TierRollupStore;
  cache: cache.TtlCache<TierRollup>;
  hits: number;
  misses: number;

  constructor(inner: TierRollupStore, cacheValue: cache.TtlCache<TierRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierRollup | undefined {
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

  save(item: TierRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierRollup[] {
    return this.inner.list();
  }
}

export function newCachedTierRollupStore(inner: TierRollupStore, ttl: number, clockValue: clock.Clock): TierRollupStore {
  return new CachedTierRollupStore(inner, cache.newTtlCache<TierRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects tier rollups. Empty fields match all. */
export class TierRollupQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierRollup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierRollup[]): TierRollup[] {
    const matched = collections.filter(items, (candidate: TierRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierRollups(store: TierRollupStore, query: TierRollupQuery): TierRollup[] {
  return query.apply(store.list());
}

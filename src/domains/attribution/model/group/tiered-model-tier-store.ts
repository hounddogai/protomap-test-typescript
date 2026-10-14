import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredModelTier } from "./tiered-model-tier.js";

/** Keeps tiered model tiers by code. */
export interface TieredModelTierStore {
  find(code: string): TieredModelTier | undefined;
  save(item: TieredModelTier): void;
  remove(code: string): boolean;
  list(): TieredModelTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredModelTierStore implements TieredModelTierStore {
  items: Map<string, TieredModelTier>;
  order: string[];

  constructor(items: Map<string, TieredModelTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredModelTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredModelTier): void {
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

  list(): TieredModelTier[] {
    const out: TieredModelTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredModelTierStore(): TieredModelTierStore {
  return new MemoryTieredModelTierStore(new Map<string, TieredModelTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredModelTierStore implements TieredModelTierStore {
  inner: TieredModelTierStore;
  cache: cache.TtlCache<TieredModelTier>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredModelTierStore,
    cacheValue: cache.TtlCache<TieredModelTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredModelTier | undefined {
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

  save(item: TieredModelTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredModelTier[] {
    return this.inner.list();
  }
}

export function newCachedTieredModelTierStore(inner: TieredModelTierStore, ttl: number, clockValue: clock.Clock): TieredModelTierStore {
  return new CachedTieredModelTierStore(inner, cache.newTtlCache<TieredModelTier>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered model tiers. Empty fields match all. */
export class TieredModelTierQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredModelTier): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredModelTier[]): TieredModelTier[] {
    const matched = collections.filter(items, (candidate: TieredModelTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredModelTiers(store: TieredModelTierStore, query: TieredModelTierQuery): TieredModelTier[] {
  return query.apply(store.list());
}

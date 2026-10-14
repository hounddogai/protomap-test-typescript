import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFlightTier } from "./global-flight-tier.js";

/** Keeps global flight tiers by code. */
export interface GlobalFlightTierStore {
  find(code: string): GlobalFlightTier | undefined;
  save(item: GlobalFlightTier): void;
  remove(code: string): boolean;
  list(): GlobalFlightTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFlightTierStore implements GlobalFlightTierStore {
  items: Map<string, GlobalFlightTier>;
  order: string[];

  constructor(items: Map<string, GlobalFlightTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFlightTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFlightTier): void {
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

  list(): GlobalFlightTier[] {
    const out: GlobalFlightTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFlightTierStore(): GlobalFlightTierStore {
  return new MemoryGlobalFlightTierStore(new Map<string, GlobalFlightTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFlightTierStore implements GlobalFlightTierStore {
  inner: GlobalFlightTierStore;
  cache: cache.TtlCache<GlobalFlightTier>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFlightTierStore,
    cacheValue: cache.TtlCache<GlobalFlightTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFlightTier | undefined {
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

  save(item: GlobalFlightTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFlightTier[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFlightTierStore(inner: GlobalFlightTierStore, ttl: number, clockValue: clock.Clock): GlobalFlightTierStore {
  return new CachedGlobalFlightTierStore(inner, cache.newTtlCache<GlobalFlightTier>(256, ttl, clockValue), 0, 0);
}

/** Selects global flight tiers. Empty fields match all. */
export class GlobalFlightTierQuery {
  category: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFloorValue: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFlightTier): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFlightTier[]): GlobalFlightTier[] {
    const matched = collections.filter(items, (candidate: GlobalFlightTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFlightTiers(store: GlobalFlightTierStore, query: GlobalFlightTierQuery): GlobalFlightTier[] {
  return query.apply(store.list());
}

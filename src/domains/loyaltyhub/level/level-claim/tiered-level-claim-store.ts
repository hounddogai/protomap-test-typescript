import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredLevelClaim } from "./tiered-level-claim.js";

/** Keeps tiered level claims by code. */
export interface TieredLevelClaimStore {
  find(code: string): TieredLevelClaim | undefined;
  save(item: TieredLevelClaim): void;
  remove(code: string): boolean;
  list(): TieredLevelClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredLevelClaimStore implements TieredLevelClaimStore {
  items: Map<string, TieredLevelClaim>;
  order: string[];

  constructor(items: Map<string, TieredLevelClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredLevelClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredLevelClaim): void {
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

  list(): TieredLevelClaim[] {
    const out: TieredLevelClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredLevelClaimStore(): TieredLevelClaimStore {
  return new MemoryTieredLevelClaimStore(new Map<string, TieredLevelClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredLevelClaimStore implements TieredLevelClaimStore {
  inner: TieredLevelClaimStore;
  cache: cache.TtlCache<TieredLevelClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredLevelClaimStore,
    cacheValue: cache.TtlCache<TieredLevelClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredLevelClaim | undefined {
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

  save(item: TieredLevelClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredLevelClaim[] {
    return this.inner.list();
  }
}

export function newCachedTieredLevelClaimStore(inner: TieredLevelClaimStore, ttl: number, clockValue: clock.Clock): TieredLevelClaimStore {
  return new CachedTieredLevelClaimStore(inner, cache.newTtlCache<TieredLevelClaim>(256, ttl, clockValue), 0, 0);
}

/** Selects tiered level claims. Empty fields match all. */
export class TieredLevelClaimQuery {
  country: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCost: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredLevelClaim): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredLevelClaim[]): TieredLevelClaim[] {
    const matched = collections.filter(items, (candidate: TieredLevelClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredLevelClaims(store: TieredLevelClaimStore, query: TieredLevelClaimQuery): TieredLevelClaim[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionClaim } from "./suppression-claim.js";

/** Keeps suppression claims by code. */
export interface SuppressionClaimStore {
  find(code: string): SuppressionClaim | undefined;
  save(item: SuppressionClaim): void;
  remove(code: string): boolean;
  list(): SuppressionClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionClaimStore implements SuppressionClaimStore {
  items: Map<string, SuppressionClaim>;
  order: string[];

  constructor(items: Map<string, SuppressionClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionClaim): void {
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

  list(): SuppressionClaim[] {
    const out: SuppressionClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionClaimStore(): SuppressionClaimStore {
  return new MemorySuppressionClaimStore(new Map<string, SuppressionClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionClaimStore implements SuppressionClaimStore {
  inner: SuppressionClaimStore;
  cache: cache.TtlCache<SuppressionClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionClaimStore,
    cacheValue: cache.TtlCache<SuppressionClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionClaim | undefined {
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

  save(item: SuppressionClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionClaim[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionClaimStore(inner: SuppressionClaimStore, ttl: number, clockValue: clock.Clock): SuppressionClaimStore {
  return new CachedSuppressionClaimStore(inner, cache.newTtlCache<SuppressionClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects suppression claims. Empty fields match all. */
export class SuppressionClaimQuery {
  region: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCost: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionClaim): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionClaim[]): SuppressionClaim[] {
    const matched = collections.filter(items, (candidate: SuppressionClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionClaims(store: SuppressionClaimStore, query: SuppressionClaimQuery): SuppressionClaim[] {
  return query.apply(store.list());
}

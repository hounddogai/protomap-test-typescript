import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceClaim } from "./bounce-claim.js";

/** Keeps bounce claims by code. */
export interface BounceClaimStore {
  find(code: string): BounceClaim | undefined;
  save(item: BounceClaim): void;
  remove(code: string): boolean;
  list(): BounceClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceClaimStore implements BounceClaimStore {
  items: Map<string, BounceClaim>;
  order: string[];

  constructor(items: Map<string, BounceClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceClaim): void {
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

  list(): BounceClaim[] {
    const out: BounceClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceClaimStore(): BounceClaimStore {
  return new MemoryBounceClaimStore(new Map<string, BounceClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceClaimStore implements BounceClaimStore {
  inner: BounceClaimStore;
  cache: cache.TtlCache<BounceClaim>;
  hits: number;
  misses: number;

  constructor(inner: BounceClaimStore, cacheValue: cache.TtlCache<BounceClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceClaim | undefined {
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

  save(item: BounceClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceClaim[] {
    return this.inner.list();
  }
}

export function newCachedBounceClaimStore(inner: BounceClaimStore, ttl: number, clockValue: clock.Clock): BounceClaimStore {
  return new CachedBounceClaimStore(inner, cache.newTtlCache<BounceClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects bounce claims. Empty fields match all. */
export class BounceClaimQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceClaim): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceClaim[]): BounceClaim[] {
    const matched = collections.filter(items, (candidate: BounceClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceClaims(store: BounceClaimStore, query: BounceClaimQuery): BounceClaim[] {
  return query.apply(store.list());
}

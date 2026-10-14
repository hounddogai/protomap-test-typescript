import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveStreakClaim } from "./adaptive-streak-claim.js";

/** Keeps adaptive streak claims by code. */
export interface AdaptiveStreakClaimStore {
  find(code: string): AdaptiveStreakClaim | undefined;
  save(item: AdaptiveStreakClaim): void;
  remove(code: string): boolean;
  list(): AdaptiveStreakClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveStreakClaimStore implements AdaptiveStreakClaimStore {
  items: Map<string, AdaptiveStreakClaim>;
  order: string[];

  constructor(items: Map<string, AdaptiveStreakClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveStreakClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveStreakClaim): void {
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

  list(): AdaptiveStreakClaim[] {
    const out: AdaptiveStreakClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveStreakClaimStore(): AdaptiveStreakClaimStore {
  return new MemoryAdaptiveStreakClaimStore(new Map<string, AdaptiveStreakClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveStreakClaimStore implements AdaptiveStreakClaimStore {
  inner: AdaptiveStreakClaimStore;
  cache: cache.TtlCache<AdaptiveStreakClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveStreakClaimStore,
    cacheValue: cache.TtlCache<AdaptiveStreakClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveStreakClaim | undefined {
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

  save(item: AdaptiveStreakClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveStreakClaim[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveStreakClaimStore(inner: AdaptiveStreakClaimStore, ttl: number, clockValue: clock.Clock): AdaptiveStreakClaimStore {
  return new CachedAdaptiveStreakClaimStore(inner, cache.newTtlCache<AdaptiveStreakClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects adaptive streak claims. Empty fields match all. */
export class AdaptiveStreakClaimQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveStreakClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveStreakClaim[]): AdaptiveStreakClaim[] {
    const matched = collections.filter(items, (candidate: AdaptiveStreakClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveStreakClaims(store: AdaptiveStreakClaimStore, query: AdaptiveStreakClaimQuery): AdaptiveStreakClaim[] {
  return query.apply(store.list());
}

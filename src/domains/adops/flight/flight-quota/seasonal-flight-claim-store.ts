import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalFlightClaim } from "./seasonal-flight-claim.js";

/** Keeps seasonal flight claims by code. */
export interface SeasonalFlightClaimStore {
  find(code: string): SeasonalFlightClaim | undefined;
  save(item: SeasonalFlightClaim): void;
  remove(code: string): boolean;
  list(): SeasonalFlightClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalFlightClaimStore implements SeasonalFlightClaimStore {
  items: Map<string, SeasonalFlightClaim>;
  order: string[];

  constructor(items: Map<string, SeasonalFlightClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalFlightClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalFlightClaim): void {
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

  list(): SeasonalFlightClaim[] {
    const out: SeasonalFlightClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalFlightClaimStore(): SeasonalFlightClaimStore {
  return new MemorySeasonalFlightClaimStore(new Map<string, SeasonalFlightClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalFlightClaimStore implements SeasonalFlightClaimStore {
  inner: SeasonalFlightClaimStore;
  cache: cache.TtlCache<SeasonalFlightClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalFlightClaimStore,
    cacheValue: cache.TtlCache<SeasonalFlightClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalFlightClaim | undefined {
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

  save(item: SeasonalFlightClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalFlightClaim[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalFlightClaimStore(inner: SeasonalFlightClaimStore, ttl: number, clockValue: clock.Clock): SeasonalFlightClaimStore {
  return new CachedSeasonalFlightClaimStore(inner, cache.newTtlCache<SeasonalFlightClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects seasonal flight claims. Empty fields match all. */
export class SeasonalFlightClaimQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalFlightClaim): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalFlightClaim[]): SeasonalFlightClaim[] {
    const matched = collections.filter(items, (candidate: SeasonalFlightClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalFlightClaims(store: SeasonalFlightClaimStore, query: SeasonalFlightClaimQuery): SeasonalFlightClaim[] {
  return query.apply(store.list());
}

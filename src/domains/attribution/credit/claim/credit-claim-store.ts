import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditClaim } from "./credit-claim.js";

/** Keeps credit claims by code. */
export interface CreditClaimStore {
  find(code: string): CreditClaim | undefined;
  save(item: CreditClaim): void;
  remove(code: string): boolean;
  list(): CreditClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditClaimStore implements CreditClaimStore {
  items: Map<string, CreditClaim>;
  order: string[];

  constructor(items: Map<string, CreditClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditClaim): void {
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

  list(): CreditClaim[] {
    const out: CreditClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditClaimStore(): CreditClaimStore {
  return new MemoryCreditClaimStore(new Map<string, CreditClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditClaimStore implements CreditClaimStore {
  inner: CreditClaimStore;
  cache: cache.TtlCache<CreditClaim>;
  hits: number;
  misses: number;

  constructor(inner: CreditClaimStore, cacheValue: cache.TtlCache<CreditClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditClaim | undefined {
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

  save(item: CreditClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditClaim[] {
    return this.inner.list();
  }
}

export function newCachedCreditClaimStore(inner: CreditClaimStore, ttl: number, clockValue: clock.Clock): CreditClaimStore {
  return new CachedCreditClaimStore(inner, cache.newTtlCache<CreditClaim>(256, ttl, clockValue), 0, 0);
}

/** Selects credit claims. Empty fields match all. */
export class CreditClaimQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditClaim): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditClaim[]): CreditClaim[] {
    const matched = collections.filter(items, (candidate: CreditClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditClaims(store: CreditClaimStore, query: CreditClaimQuery): CreditClaim[] {
  return query.apply(store.list());
}

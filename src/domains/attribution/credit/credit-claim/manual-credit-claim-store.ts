import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualCreditClaim } from "./manual-credit-claim.js";

/** Keeps manual credit claims by code. */
export interface ManualCreditClaimStore {
  find(code: string): ManualCreditClaim | undefined;
  save(item: ManualCreditClaim): void;
  remove(code: string): boolean;
  list(): ManualCreditClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualCreditClaimStore implements ManualCreditClaimStore {
  items: Map<string, ManualCreditClaim>;
  order: string[];

  constructor(items: Map<string, ManualCreditClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualCreditClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualCreditClaim): void {
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

  list(): ManualCreditClaim[] {
    const out: ManualCreditClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualCreditClaimStore(): ManualCreditClaimStore {
  return new MemoryManualCreditClaimStore(new Map<string, ManualCreditClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualCreditClaimStore implements ManualCreditClaimStore {
  inner: ManualCreditClaimStore;
  cache: cache.TtlCache<ManualCreditClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualCreditClaimStore,
    cacheValue: cache.TtlCache<ManualCreditClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualCreditClaim | undefined {
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

  save(item: ManualCreditClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualCreditClaim[] {
    return this.inner.list();
  }
}

export function newCachedManualCreditClaimStore(inner: ManualCreditClaimStore, ttl: number, clockValue: clock.Clock): ManualCreditClaimStore {
  return new CachedManualCreditClaimStore(inner, cache.newTtlCache<ManualCreditClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects manual credit claims. Empty fields match all. */
export class ManualCreditClaimQuery {
  category: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minWindowDays: number, statuses: string[], limit: number) {
    this.category = category;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualCreditClaim): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualCreditClaim[]): ManualCreditClaim[] {
    const matched = collections.filter(items, (candidate: ManualCreditClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualCreditClaims(store: ManualCreditClaimStore, query: ManualCreditClaimQuery): ManualCreditClaim[] {
  return query.apply(store.list());
}

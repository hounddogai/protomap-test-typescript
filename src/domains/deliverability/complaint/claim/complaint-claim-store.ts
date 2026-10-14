import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintClaim } from "./complaint-claim.js";

/** Keeps complaint claims by code. */
export interface ComplaintClaimStore {
  find(code: string): ComplaintClaim | undefined;
  save(item: ComplaintClaim): void;
  remove(code: string): boolean;
  list(): ComplaintClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintClaimStore implements ComplaintClaimStore {
  items: Map<string, ComplaintClaim>;
  order: string[];

  constructor(items: Map<string, ComplaintClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintClaim): void {
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

  list(): ComplaintClaim[] {
    const out: ComplaintClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintClaimStore(): ComplaintClaimStore {
  return new MemoryComplaintClaimStore(new Map<string, ComplaintClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintClaimStore implements ComplaintClaimStore {
  inner: ComplaintClaimStore;
  cache: cache.TtlCache<ComplaintClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintClaimStore,
    cacheValue: cache.TtlCache<ComplaintClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintClaim | undefined {
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

  save(item: ComplaintClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintClaim[] {
    return this.inner.list();
  }
}

export function newCachedComplaintClaimStore(inner: ComplaintClaimStore, ttl: number, clockValue: clock.Clock): ComplaintClaimStore {
  return new CachedComplaintClaimStore(inner, cache.newTtlCache<ComplaintClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint claims. Empty fields match all. */
export class ComplaintClaimQuery {
  category: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAmount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintClaim): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintClaim[]): ComplaintClaim[] {
    const matched = collections.filter(items, (candidate: ComplaintClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintClaims(store: ComplaintClaimStore, query: ComplaintClaimQuery): ComplaintClaim[] {
  return query.apply(store.list());
}

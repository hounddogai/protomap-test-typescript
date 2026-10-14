import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentClaim } from "./enrollment-claim.js";

/** Keeps enrollment claims by code. */
export interface EnrollmentClaimStore {
  find(code: string): EnrollmentClaim | undefined;
  save(item: EnrollmentClaim): void;
  remove(code: string): boolean;
  list(): EnrollmentClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentClaimStore implements EnrollmentClaimStore {
  items: Map<string, EnrollmentClaim>;
  order: string[];

  constructor(items: Map<string, EnrollmentClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentClaim): void {
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

  list(): EnrollmentClaim[] {
    const out: EnrollmentClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentClaimStore(): EnrollmentClaimStore {
  return new MemoryEnrollmentClaimStore(new Map<string, EnrollmentClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentClaimStore implements EnrollmentClaimStore {
  inner: EnrollmentClaimStore;
  cache: cache.TtlCache<EnrollmentClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentClaimStore,
    cacheValue: cache.TtlCache<EnrollmentClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentClaim | undefined {
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

  save(item: EnrollmentClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentClaim[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentClaimStore(inner: EnrollmentClaimStore, ttl: number, clockValue: clock.Clock): EnrollmentClaimStore {
  return new CachedEnrollmentClaimStore(inner, cache.newTtlCache<EnrollmentClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects enrollment claims. Empty fields match all. */
export class EnrollmentClaimQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentClaim): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentClaim[]): EnrollmentClaim[] {
    const matched = collections.filter(items, (candidate: EnrollmentClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentClaims(store: EnrollmentClaimStore, query: EnrollmentClaimQuery): EnrollmentClaim[] {
  return query.apply(store.list());
}

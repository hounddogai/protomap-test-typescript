import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPathClaim } from "./lenient-path-claim.js";

/** Keeps lenient path claims by code. */
export interface LenientPathClaimStore {
  find(code: string): LenientPathClaim | undefined;
  save(item: LenientPathClaim): void;
  remove(code: string): boolean;
  list(): LenientPathClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPathClaimStore implements LenientPathClaimStore {
  items: Map<string, LenientPathClaim>;
  order: string[];

  constructor(items: Map<string, LenientPathClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPathClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPathClaim): void {
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

  list(): LenientPathClaim[] {
    const out: LenientPathClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPathClaimStore(): LenientPathClaimStore {
  return new MemoryLenientPathClaimStore(new Map<string, LenientPathClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPathClaimStore implements LenientPathClaimStore {
  inner: LenientPathClaimStore;
  cache: cache.TtlCache<LenientPathClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPathClaimStore,
    cacheValue: cache.TtlCache<LenientPathClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPathClaim | undefined {
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

  save(item: LenientPathClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPathClaim[] {
    return this.inner.list();
  }
}

export function newCachedLenientPathClaimStore(inner: LenientPathClaimStore, ttl: number, clockValue: clock.Clock): LenientPathClaimStore {
  return new CachedLenientPathClaimStore(inner, cache.newTtlCache<LenientPathClaim>(512, ttl, clockValue), 0, 0);
}

/** Selects lenient path claims. Empty fields match all. */
export class LenientPathClaimQuery {
  country: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minPriority: number, statuses: string[], limit: number) {
    this.country = country;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPathClaim): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPathClaim[]): LenientPathClaim[] {
    const matched = collections.filter(items, (candidate: LenientPathClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPathClaims(store: LenientPathClaimStore, query: LenientPathClaimQuery): LenientPathClaim[] {
  return query.apply(store.list());
}

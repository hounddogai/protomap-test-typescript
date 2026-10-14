import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictOptOutClaim } from "./strict-opt-out-claim.js";

/** Keeps strict opt out claims by code. */
export interface StrictOptOutClaimStore {
  find(code: string): StrictOptOutClaim | undefined;
  save(item: StrictOptOutClaim): void;
  remove(code: string): boolean;
  list(): StrictOptOutClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictOptOutClaimStore implements StrictOptOutClaimStore {
  items: Map<string, StrictOptOutClaim>;
  order: string[];

  constructor(items: Map<string, StrictOptOutClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictOptOutClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictOptOutClaim): void {
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

  list(): StrictOptOutClaim[] {
    const out: StrictOptOutClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictOptOutClaimStore(): StrictOptOutClaimStore {
  return new MemoryStrictOptOutClaimStore(new Map<string, StrictOptOutClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictOptOutClaimStore implements StrictOptOutClaimStore {
  inner: StrictOptOutClaimStore;
  cache: cache.TtlCache<StrictOptOutClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictOptOutClaimStore,
    cacheValue: cache.TtlCache<StrictOptOutClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictOptOutClaim | undefined {
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

  save(item: StrictOptOutClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictOptOutClaim[] {
    return this.inner.list();
  }
}

export function newCachedStrictOptOutClaimStore(inner: StrictOptOutClaimStore, ttl: number, clockValue: clock.Clock): StrictOptOutClaimStore {
  return new CachedStrictOptOutClaimStore(inner, cache.newTtlCache<StrictOptOutClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects strict opt out claims. Empty fields match all. */
export class StrictOptOutClaimQuery {
  source: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minClicks: number, statuses: string[], limit: number) {
    this.source = source;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictOptOutClaim): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictOptOutClaim[]): StrictOptOutClaim[] {
    const matched = collections.filter(items, (candidate: StrictOptOutClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictOptOutClaims(store: StrictOptOutClaimStore, query: StrictOptOutClaimQuery): StrictOptOutClaim[] {
  return query.apply(store.list());
}

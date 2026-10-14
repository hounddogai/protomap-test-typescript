import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualFlightClaim } from "./manual-flight-claim.js";

/** Keeps manual flight claims by code. */
export interface ManualFlightClaimStore {
  find(code: string): ManualFlightClaim | undefined;
  save(item: ManualFlightClaim): void;
  remove(code: string): boolean;
  list(): ManualFlightClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualFlightClaimStore implements ManualFlightClaimStore {
  items: Map<string, ManualFlightClaim>;
  order: string[];

  constructor(items: Map<string, ManualFlightClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualFlightClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualFlightClaim): void {
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

  list(): ManualFlightClaim[] {
    const out: ManualFlightClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualFlightClaimStore(): ManualFlightClaimStore {
  return new MemoryManualFlightClaimStore(new Map<string, ManualFlightClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualFlightClaimStore implements ManualFlightClaimStore {
  inner: ManualFlightClaimStore;
  cache: cache.TtlCache<ManualFlightClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualFlightClaimStore,
    cacheValue: cache.TtlCache<ManualFlightClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualFlightClaim | undefined {
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

  save(item: ManualFlightClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualFlightClaim[] {
    return this.inner.list();
  }
}

export function newCachedManualFlightClaimStore(inner: ManualFlightClaimStore, ttl: number, clockValue: clock.Clock): ManualFlightClaimStore {
  return new CachedManualFlightClaimStore(inner, cache.newTtlCache<ManualFlightClaim>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual flight claims. Empty fields match all. */
export class ManualFlightClaimQuery {
  segment: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualFlightClaim): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualFlightClaim[]): ManualFlightClaim[] {
    const matched = collections.filter(items, (candidate: ManualFlightClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualFlightClaims(store: ManualFlightClaimStore, query: ManualFlightClaimQuery): ManualFlightClaim[] {
  return query.apply(store.list());
}

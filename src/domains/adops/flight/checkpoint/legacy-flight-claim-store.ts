import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFlightClaim } from "./legacy-flight-claim.js";

/** Keeps legacy flight claims by code. */
export interface LegacyFlightClaimStore {
  find(code: string): LegacyFlightClaim | undefined;
  save(item: LegacyFlightClaim): void;
  remove(code: string): boolean;
  list(): LegacyFlightClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFlightClaimStore implements LegacyFlightClaimStore {
  items: Map<string, LegacyFlightClaim>;
  order: string[];

  constructor(items: Map<string, LegacyFlightClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFlightClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFlightClaim): void {
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

  list(): LegacyFlightClaim[] {
    const out: LegacyFlightClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFlightClaimStore(): LegacyFlightClaimStore {
  return new MemoryLegacyFlightClaimStore(new Map<string, LegacyFlightClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFlightClaimStore implements LegacyFlightClaimStore {
  inner: LegacyFlightClaimStore;
  cache: cache.TtlCache<LegacyFlightClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFlightClaimStore,
    cacheValue: cache.TtlCache<LegacyFlightClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFlightClaim | undefined {
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

  save(item: LegacyFlightClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFlightClaim[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFlightClaimStore(inner: LegacyFlightClaimStore, ttl: number, clockValue: clock.Clock): LegacyFlightClaimStore {
  return new CachedLegacyFlightClaimStore(inner, cache.newTtlCache<LegacyFlightClaim>(1024, ttl, clockValue), 0, 0);
}

/** Selects legacy flight claims. Empty fields match all. */
export class LegacyFlightClaimQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFlightClaim): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFlightClaim[]): LegacyFlightClaim[] {
    const matched = collections.filter(items, (candidate: LegacyFlightClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFlightClaims(store: LegacyFlightClaimStore, query: LegacyFlightClaimQuery): LegacyFlightClaim[] {
  return query.apply(store.list());
}

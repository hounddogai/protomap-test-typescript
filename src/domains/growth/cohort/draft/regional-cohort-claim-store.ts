import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalCohortClaim } from "./regional-cohort-claim.js";

/** Keeps regional cohort claims by code. */
export interface RegionalCohortClaimStore {
  find(code: string): RegionalCohortClaim | undefined;
  save(item: RegionalCohortClaim): void;
  remove(code: string): boolean;
  list(): RegionalCohortClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalCohortClaimStore implements RegionalCohortClaimStore {
  items: Map<string, RegionalCohortClaim>;
  order: string[];

  constructor(items: Map<string, RegionalCohortClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalCohortClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalCohortClaim): void {
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

  list(): RegionalCohortClaim[] {
    const out: RegionalCohortClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalCohortClaimStore(): RegionalCohortClaimStore {
  return new MemoryRegionalCohortClaimStore(new Map<string, RegionalCohortClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalCohortClaimStore implements RegionalCohortClaimStore {
  inner: RegionalCohortClaimStore;
  cache: cache.TtlCache<RegionalCohortClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalCohortClaimStore,
    cacheValue: cache.TtlCache<RegionalCohortClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalCohortClaim | undefined {
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

  save(item: RegionalCohortClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalCohortClaim[] {
    return this.inner.list();
  }
}

export function newCachedRegionalCohortClaimStore(inner: RegionalCohortClaimStore, ttl: number, clockValue: clock.Clock): RegionalCohortClaimStore {
  return new CachedRegionalCohortClaimStore(inner, cache.newTtlCache<RegionalCohortClaim>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional cohort claims. Empty fields match all. */
export class RegionalCohortClaimQuery {
  channel: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBid: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalCohortClaim): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalCohortClaim[]): RegionalCohortClaim[] {
    const matched = collections.filter(items, (candidate: RegionalCohortClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalCohortClaims(store: RegionalCohortClaimStore, query: RegionalCohortClaimQuery): RegionalCohortClaim[] {
  return query.apply(store.list());
}

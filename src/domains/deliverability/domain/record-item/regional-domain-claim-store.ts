import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalDomainClaim } from "./regional-domain-claim.js";

/** Keeps regional domain claims by code. */
export interface RegionalDomainClaimStore {
  find(code: string): RegionalDomainClaim | undefined;
  save(item: RegionalDomainClaim): void;
  remove(code: string): boolean;
  list(): RegionalDomainClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalDomainClaimStore implements RegionalDomainClaimStore {
  items: Map<string, RegionalDomainClaim>;
  order: string[];

  constructor(items: Map<string, RegionalDomainClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalDomainClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalDomainClaim): void {
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

  list(): RegionalDomainClaim[] {
    const out: RegionalDomainClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalDomainClaimStore(): RegionalDomainClaimStore {
  return new MemoryRegionalDomainClaimStore(new Map<string, RegionalDomainClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalDomainClaimStore implements RegionalDomainClaimStore {
  inner: RegionalDomainClaimStore;
  cache: cache.TtlCache<RegionalDomainClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalDomainClaimStore,
    cacheValue: cache.TtlCache<RegionalDomainClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalDomainClaim | undefined {
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

  save(item: RegionalDomainClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalDomainClaim[] {
    return this.inner.list();
  }
}

export function newCachedRegionalDomainClaimStore(inner: RegionalDomainClaimStore, ttl: number, clockValue: clock.Clock): RegionalDomainClaimStore {
  return new CachedRegionalDomainClaimStore(inner, cache.newTtlCache<RegionalDomainClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects regional domain claims. Empty fields match all. */
export class RegionalDomainClaimQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalDomainClaim): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalDomainClaim[]): RegionalDomainClaim[] {
    const matched = collections.filter(items, (candidate: RegionalDomainClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalDomainClaims(store: RegionalDomainClaimStore, query: RegionalDomainClaimQuery): RegionalDomainClaim[] {
  return query.apply(store.list());
}

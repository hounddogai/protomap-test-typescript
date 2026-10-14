import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryOptOutClaim } from "./primary-opt-out-claim.js";

/** Keeps primary opt out claims by code. */
export interface PrimaryOptOutClaimStore {
  find(code: string): PrimaryOptOutClaim | undefined;
  save(item: PrimaryOptOutClaim): void;
  remove(code: string): boolean;
  list(): PrimaryOptOutClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryOptOutClaimStore implements PrimaryOptOutClaimStore {
  items: Map<string, PrimaryOptOutClaim>;
  order: string[];

  constructor(items: Map<string, PrimaryOptOutClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryOptOutClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryOptOutClaim): void {
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

  list(): PrimaryOptOutClaim[] {
    const out: PrimaryOptOutClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryOptOutClaimStore(): PrimaryOptOutClaimStore {
  return new MemoryPrimaryOptOutClaimStore(new Map<string, PrimaryOptOutClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryOptOutClaimStore implements PrimaryOptOutClaimStore {
  inner: PrimaryOptOutClaimStore;
  cache: cache.TtlCache<PrimaryOptOutClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryOptOutClaimStore,
    cacheValue: cache.TtlCache<PrimaryOptOutClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryOptOutClaim | undefined {
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

  save(item: PrimaryOptOutClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryOptOutClaim[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryOptOutClaimStore(inner: PrimaryOptOutClaimStore, ttl: number, clockValue: clock.Clock): PrimaryOptOutClaimStore {
  return new CachedPrimaryOptOutClaimStore(inner, cache.newTtlCache<PrimaryOptOutClaim>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary opt out claims. Empty fields match all. */
export class PrimaryOptOutClaimQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryOptOutClaim): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryOptOutClaim[]): PrimaryOptOutClaim[] {
    const matched = collections.filter(items, (candidate: PrimaryOptOutClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryOptOutClaims(store: PrimaryOptOutClaimStore, query: PrimaryOptOutClaimQuery): PrimaryOptOutClaim[] {
  return query.apply(store.list());
}

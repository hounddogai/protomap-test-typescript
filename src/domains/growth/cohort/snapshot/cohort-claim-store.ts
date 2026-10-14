import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortClaim } from "./cohort-claim.js";

/** Keeps cohort claims by code. */
export interface CohortClaimStore {
  find(code: string): CohortClaim | undefined;
  save(item: CohortClaim): void;
  remove(code: string): boolean;
  list(): CohortClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortClaimStore implements CohortClaimStore {
  items: Map<string, CohortClaim>;
  order: string[];

  constructor(items: Map<string, CohortClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortClaim): void {
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

  list(): CohortClaim[] {
    const out: CohortClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortClaimStore(): CohortClaimStore {
  return new MemoryCohortClaimStore(new Map<string, CohortClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortClaimStore implements CohortClaimStore {
  inner: CohortClaimStore;
  cache: cache.TtlCache<CohortClaim>;
  hits: number;
  misses: number;

  constructor(inner: CohortClaimStore, cacheValue: cache.TtlCache<CohortClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortClaim | undefined {
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

  save(item: CohortClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortClaim[] {
    return this.inner.list();
  }
}

export function newCachedCohortClaimStore(inner: CohortClaimStore, ttl: number, clockValue: clock.Clock): CohortClaimStore {
  return new CachedCohortClaimStore(inner, cache.newTtlCache<CohortClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects cohort claims. Empty fields match all. */
export class CohortClaimQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortClaim): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortClaim[]): CohortClaim[] {
    const matched = collections.filter(items, (candidate: CohortClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortClaims(store: CohortClaimStore, query: CohortClaimQuery): CohortClaim[] {
  return query.apply(store.list());
}

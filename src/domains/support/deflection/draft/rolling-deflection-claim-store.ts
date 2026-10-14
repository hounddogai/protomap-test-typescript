import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingDeflectionClaim } from "./rolling-deflection-claim.js";

/** Keeps rolling deflection claims by code. */
export interface RollingDeflectionClaimStore {
  find(code: string): RollingDeflectionClaim | undefined;
  save(item: RollingDeflectionClaim): void;
  remove(code: string): boolean;
  list(): RollingDeflectionClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingDeflectionClaimStore implements RollingDeflectionClaimStore {
  items: Map<string, RollingDeflectionClaim>;
  order: string[];

  constructor(items: Map<string, RollingDeflectionClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingDeflectionClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingDeflectionClaim): void {
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

  list(): RollingDeflectionClaim[] {
    const out: RollingDeflectionClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingDeflectionClaimStore(): RollingDeflectionClaimStore {
  return new MemoryRollingDeflectionClaimStore(new Map<string, RollingDeflectionClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingDeflectionClaimStore implements RollingDeflectionClaimStore {
  inner: RollingDeflectionClaimStore;
  cache: cache.TtlCache<RollingDeflectionClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingDeflectionClaimStore,
    cacheValue: cache.TtlCache<RollingDeflectionClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingDeflectionClaim | undefined {
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

  save(item: RollingDeflectionClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingDeflectionClaim[] {
    return this.inner.list();
  }
}

export function newCachedRollingDeflectionClaimStore(inner: RollingDeflectionClaimStore, ttl: number, clockValue: clock.Clock): RollingDeflectionClaimStore {
  return new CachedRollingDeflectionClaimStore(
    inner,
    cache.newTtlCache<RollingDeflectionClaim>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling deflection claims. Empty fields match all. */
export class RollingDeflectionClaimQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingDeflectionClaim): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingDeflectionClaim[]): RollingDeflectionClaim[] {
    const matched = collections.filter(items, (candidate: RollingDeflectionClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingDeflectionClaims(store: RollingDeflectionClaimStore, query: RollingDeflectionClaimQuery): RollingDeflectionClaim[] {
  return query.apply(store.list());
}

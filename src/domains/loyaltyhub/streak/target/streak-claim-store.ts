import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakClaim } from "./streak-claim.js";

/** Keeps streak claims by code. */
export interface StreakClaimStore {
  find(code: string): StreakClaim | undefined;
  save(item: StreakClaim): void;
  remove(code: string): boolean;
  list(): StreakClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakClaimStore implements StreakClaimStore {
  items: Map<string, StreakClaim>;
  order: string[];

  constructor(items: Map<string, StreakClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakClaim): void {
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

  list(): StreakClaim[] {
    const out: StreakClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakClaimStore(): StreakClaimStore {
  return new MemoryStreakClaimStore(new Map<string, StreakClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakClaimStore implements StreakClaimStore {
  inner: StreakClaimStore;
  cache: cache.TtlCache<StreakClaim>;
  hits: number;
  misses: number;

  constructor(inner: StreakClaimStore, cacheValue: cache.TtlCache<StreakClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakClaim | undefined {
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

  save(item: StreakClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakClaim[] {
    return this.inner.list();
  }
}

export function newCachedStreakClaimStore(inner: StreakClaimStore, ttl: number, clockValue: clock.Clock): StreakClaimStore {
  return new CachedStreakClaimStore(inner, cache.newTtlCache<StreakClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects streak claims. Empty fields match all. */
export class StreakClaimQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakClaim): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakClaim[]): StreakClaim[] {
    const matched = collections.filter(items, (candidate: StreakClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakClaims(store: StreakClaimStore, query: StreakClaimQuery): StreakClaim[] {
  return query.apply(store.list());
}

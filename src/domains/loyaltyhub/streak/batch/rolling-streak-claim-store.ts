import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingStreakClaim } from "./rolling-streak-claim.js";

/** Keeps rolling streak claims by code. */
export interface RollingStreakClaimStore {
  find(code: string): RollingStreakClaim | undefined;
  save(item: RollingStreakClaim): void;
  remove(code: string): boolean;
  list(): RollingStreakClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingStreakClaimStore implements RollingStreakClaimStore {
  items: Map<string, RollingStreakClaim>;
  order: string[];

  constructor(items: Map<string, RollingStreakClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingStreakClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingStreakClaim): void {
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

  list(): RollingStreakClaim[] {
    const out: RollingStreakClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingStreakClaimStore(): RollingStreakClaimStore {
  return new MemoryRollingStreakClaimStore(new Map<string, RollingStreakClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingStreakClaimStore implements RollingStreakClaimStore {
  inner: RollingStreakClaimStore;
  cache: cache.TtlCache<RollingStreakClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingStreakClaimStore,
    cacheValue: cache.TtlCache<RollingStreakClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingStreakClaim | undefined {
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

  save(item: RollingStreakClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingStreakClaim[] {
    return this.inner.list();
  }
}

export function newCachedRollingStreakClaimStore(inner: RollingStreakClaimStore, ttl: number, clockValue: clock.Clock): RollingStreakClaimStore {
  return new CachedRollingStreakClaimStore(inner, cache.newTtlCache<RollingStreakClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects rolling streak claims. Empty fields match all. */
export class RollingStreakClaimQuery {
  locale: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWindowDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingStreakClaim): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingStreakClaim[]): RollingStreakClaim[] {
    const matched = collections.filter(items, (candidate: RollingStreakClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingStreakClaims(store: RollingStreakClaimStore, query: RollingStreakClaimQuery): RollingStreakClaim[] {
  return query.apply(store.list());
}

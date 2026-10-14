import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyCohortClaim } from "./legacy-cohort-claim.js";

/** Keeps legacy cohort claims by code. */
export interface LegacyCohortClaimStore {
  find(code: string): LegacyCohortClaim | undefined;
  save(item: LegacyCohortClaim): void;
  remove(code: string): boolean;
  list(): LegacyCohortClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyCohortClaimStore implements LegacyCohortClaimStore {
  items: Map<string, LegacyCohortClaim>;
  order: string[];

  constructor(items: Map<string, LegacyCohortClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyCohortClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyCohortClaim): void {
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

  list(): LegacyCohortClaim[] {
    const out: LegacyCohortClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyCohortClaimStore(): LegacyCohortClaimStore {
  return new MemoryLegacyCohortClaimStore(new Map<string, LegacyCohortClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyCohortClaimStore implements LegacyCohortClaimStore {
  inner: LegacyCohortClaimStore;
  cache: cache.TtlCache<LegacyCohortClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyCohortClaimStore,
    cacheValue: cache.TtlCache<LegacyCohortClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyCohortClaim | undefined {
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

  save(item: LegacyCohortClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyCohortClaim[] {
    return this.inner.list();
  }
}

export function newCachedLegacyCohortClaimStore(inner: LegacyCohortClaimStore, ttl: number, clockValue: clock.Clock): LegacyCohortClaimStore {
  return new CachedLegacyCohortClaimStore(inner, cache.newTtlCache<LegacyCohortClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy cohort claims. Empty fields match all. */
export class LegacyCohortClaimQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyCohortClaim): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyCohortClaim[]): LegacyCohortClaim[] {
    const matched = collections.filter(items, (candidate: LegacyCohortClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyCohortClaims(store: LegacyCohortClaimStore, query: LegacyCohortClaimQuery): LegacyCohortClaim[] {
  return query.apply(store.list());
}

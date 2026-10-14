import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionClaim } from "./redemption-claim.js";

/** Keeps redemption claims by code. */
export interface RedemptionClaimStore {
  find(code: string): RedemptionClaim | undefined;
  save(item: RedemptionClaim): void;
  remove(code: string): boolean;
  list(): RedemptionClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionClaimStore implements RedemptionClaimStore {
  items: Map<string, RedemptionClaim>;
  order: string[];

  constructor(items: Map<string, RedemptionClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionClaim): void {
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

  list(): RedemptionClaim[] {
    const out: RedemptionClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionClaimStore(): RedemptionClaimStore {
  return new MemoryRedemptionClaimStore(new Map<string, RedemptionClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionClaimStore implements RedemptionClaimStore {
  inner: RedemptionClaimStore;
  cache: cache.TtlCache<RedemptionClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionClaimStore,
    cacheValue: cache.TtlCache<RedemptionClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionClaim | undefined {
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

  save(item: RedemptionClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionClaim[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionClaimStore(inner: RedemptionClaimStore, ttl: number, clockValue: clock.Clock): RedemptionClaimStore {
  return new CachedRedemptionClaimStore(inner, cache.newTtlCache<RedemptionClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects redemption claims. Empty fields match all. */
export class RedemptionClaimQuery {
  channel: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minLimit: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionClaim): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionClaim[]): RedemptionClaim[] {
    const matched = collections.filter(items, (candidate: RedemptionClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionClaims(store: RedemptionClaimStore, query: RedemptionClaimQuery): RedemptionClaim[] {
  return query.apply(store.list());
}

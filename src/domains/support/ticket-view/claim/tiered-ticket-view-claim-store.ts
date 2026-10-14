import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredTicketViewClaim } from "./tiered-ticket-view-claim.js";

/** Keeps tiered ticket view claims by code. */
export interface TieredTicketViewClaimStore {
  find(code: string): TieredTicketViewClaim | undefined;
  save(item: TieredTicketViewClaim): void;
  remove(code: string): boolean;
  list(): TieredTicketViewClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredTicketViewClaimStore implements TieredTicketViewClaimStore {
  items: Map<string, TieredTicketViewClaim>;
  order: string[];

  constructor(items: Map<string, TieredTicketViewClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredTicketViewClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredTicketViewClaim): void {
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

  list(): TieredTicketViewClaim[] {
    const out: TieredTicketViewClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredTicketViewClaimStore(): TieredTicketViewClaimStore {
  return new MemoryTieredTicketViewClaimStore(new Map<string, TieredTicketViewClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredTicketViewClaimStore implements TieredTicketViewClaimStore {
  inner: TieredTicketViewClaimStore;
  cache: cache.TtlCache<TieredTicketViewClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredTicketViewClaimStore,
    cacheValue: cache.TtlCache<TieredTicketViewClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredTicketViewClaim | undefined {
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

  save(item: TieredTicketViewClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredTicketViewClaim[] {
    return this.inner.list();
  }
}

export function newCachedTieredTicketViewClaimStore(inner: TieredTicketViewClaimStore, ttl: number, clockValue: clock.Clock): TieredTicketViewClaimStore {
  return new CachedTieredTicketViewClaimStore(
    inner,
    cache.newTtlCache<TieredTicketViewClaim>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered ticket view claims. Empty fields match all. */
export class TieredTicketViewClaimQuery {
  unit: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBid: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredTicketViewClaim): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredTicketViewClaim[]): TieredTicketViewClaim[] {
    const matched = collections.filter(items, (candidate: TieredTicketViewClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredTicketViewClaims(store: TieredTicketViewClaimStore, query: TieredTicketViewClaimQuery): TieredTicketViewClaim[] {
  return query.apply(store.list());
}

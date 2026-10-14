import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalTicketViewClaim } from "./global-ticket-view-claim.js";

/** Keeps global ticket view claims by code. */
export interface GlobalTicketViewClaimStore {
  find(code: string): GlobalTicketViewClaim | undefined;
  save(item: GlobalTicketViewClaim): void;
  remove(code: string): boolean;
  list(): GlobalTicketViewClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalTicketViewClaimStore implements GlobalTicketViewClaimStore {
  items: Map<string, GlobalTicketViewClaim>;
  order: string[];

  constructor(items: Map<string, GlobalTicketViewClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalTicketViewClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalTicketViewClaim): void {
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

  list(): GlobalTicketViewClaim[] {
    const out: GlobalTicketViewClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalTicketViewClaimStore(): GlobalTicketViewClaimStore {
  return new MemoryGlobalTicketViewClaimStore(new Map<string, GlobalTicketViewClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalTicketViewClaimStore implements GlobalTicketViewClaimStore {
  inner: GlobalTicketViewClaimStore;
  cache: cache.TtlCache<GlobalTicketViewClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalTicketViewClaimStore,
    cacheValue: cache.TtlCache<GlobalTicketViewClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalTicketViewClaim | undefined {
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

  save(item: GlobalTicketViewClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalTicketViewClaim[] {
    return this.inner.list();
  }
}

export function newCachedGlobalTicketViewClaimStore(inner: GlobalTicketViewClaimStore, ttl: number, clockValue: clock.Clock): GlobalTicketViewClaimStore {
  return new CachedGlobalTicketViewClaimStore(
    inner,
    cache.newTtlCache<GlobalTicketViewClaim>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global ticket view claims. Empty fields match all. */
export class GlobalTicketViewClaimQuery {
  unit: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minStartsAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalTicketViewClaim): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalTicketViewClaim[]): GlobalTicketViewClaim[] {
    const matched = collections.filter(items, (candidate: GlobalTicketViewClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalTicketViewClaims(store: GlobalTicketViewClaimStore, query: GlobalTicketViewClaimQuery): GlobalTicketViewClaim[] {
  return query.apply(store.list());
}

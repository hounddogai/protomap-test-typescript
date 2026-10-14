import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewClaim } from "./ticket-view-claim.js";

/** Keeps ticket view claims by code. */
export interface TicketViewClaimStore {
  find(code: string): TicketViewClaim | undefined;
  save(item: TicketViewClaim): void;
  remove(code: string): boolean;
  list(): TicketViewClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewClaimStore implements TicketViewClaimStore {
  items: Map<string, TicketViewClaim>;
  order: string[];

  constructor(items: Map<string, TicketViewClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewClaim): void {
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

  list(): TicketViewClaim[] {
    const out: TicketViewClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewClaimStore(): TicketViewClaimStore {
  return new MemoryTicketViewClaimStore(new Map<string, TicketViewClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewClaimStore implements TicketViewClaimStore {
  inner: TicketViewClaimStore;
  cache: cache.TtlCache<TicketViewClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewClaimStore,
    cacheValue: cache.TtlCache<TicketViewClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewClaim | undefined {
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

  save(item: TicketViewClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewClaim[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewClaimStore(inner: TicketViewClaimStore, ttl: number, clockValue: clock.Clock): TicketViewClaimStore {
  return new CachedTicketViewClaimStore(inner, cache.newTtlCache<TicketViewClaim>(64, ttl, clockValue), 0, 0);
}

/** Selects ticket view claims. Empty fields match all. */
export class TicketViewClaimQuery {
  name: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBatchSize: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewClaim): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewClaim[]): TicketViewClaim[] {
    const matched = collections.filter(items, (candidate: TicketViewClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewClaims(store: TicketViewClaimStore, query: TicketViewClaimQuery): TicketViewClaim[] {
  return query.apply(store.list());
}

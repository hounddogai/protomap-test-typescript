import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewRequest } from "./ticket-view-request.js";

/** Keeps ticket view requests by code. */
export interface TicketViewRequestStore {
  find(code: string): TicketViewRequest | undefined;
  save(item: TicketViewRequest): void;
  remove(code: string): boolean;
  list(): TicketViewRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewRequestStore implements TicketViewRequestStore {
  items: Map<string, TicketViewRequest>;
  order: string[];

  constructor(items: Map<string, TicketViewRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewRequest): void {
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

  list(): TicketViewRequest[] {
    const out: TicketViewRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewRequestStore(): TicketViewRequestStore {
  return new MemoryTicketViewRequestStore(new Map<string, TicketViewRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewRequestStore implements TicketViewRequestStore {
  inner: TicketViewRequestStore;
  cache: cache.TtlCache<TicketViewRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewRequestStore,
    cacheValue: cache.TtlCache<TicketViewRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewRequest | undefined {
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

  save(item: TicketViewRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewRequest[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewRequestStore(inner: TicketViewRequestStore, ttl: number, clockValue: clock.Clock): TicketViewRequestStore {
  return new CachedTicketViewRequestStore(inner, cache.newTtlCache<TicketViewRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects ticket view requests. Empty fields match all. */
export class TicketViewRequestQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewRequest): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewRequest[]): TicketViewRequest[] {
    const matched = collections.filter(items, (candidate: TicketViewRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewRequests(store: TicketViewRequestStore, query: TicketViewRequestQuery): TicketViewRequest[] {
  return query.apply(store.list());
}

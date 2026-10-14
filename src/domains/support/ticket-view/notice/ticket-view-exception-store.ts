import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewException } from "./ticket-view-exception.js";

/** Keeps ticket view exceptions by code. */
export interface TicketViewExceptionStore {
  find(code: string): TicketViewException | undefined;
  save(item: TicketViewException): void;
  remove(code: string): boolean;
  list(): TicketViewException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewExceptionStore implements TicketViewExceptionStore {
  items: Map<string, TicketViewException>;
  order: string[];

  constructor(items: Map<string, TicketViewException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewException): void {
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

  list(): TicketViewException[] {
    const out: TicketViewException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewExceptionStore(): TicketViewExceptionStore {
  return new MemoryTicketViewExceptionStore(new Map<string, TicketViewException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewExceptionStore implements TicketViewExceptionStore {
  inner: TicketViewExceptionStore;
  cache: cache.TtlCache<TicketViewException>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewExceptionStore,
    cacheValue: cache.TtlCache<TicketViewException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewException | undefined {
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

  save(item: TicketViewException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewException[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewExceptionStore(inner: TicketViewExceptionStore, ttl: number, clockValue: clock.Clock): TicketViewExceptionStore {
  return new CachedTicketViewExceptionStore(inner, cache.newTtlCache<TicketViewException>(64, ttl, clockValue), 0, 0);
}

/** Selects ticket view exceptions. Empty fields match all. */
export class TicketViewExceptionQuery {
  channel: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minQuantity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewException[]): TicketViewException[] {
    const matched = collections.filter(items, (candidate: TicketViewException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewExceptions(store: TicketViewExceptionStore, query: TicketViewExceptionQuery): TicketViewException[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewEstimate } from "./ticket-view-estimate.js";

/** Keeps ticket view estimates by code. */
export interface TicketViewEstimateStore {
  find(code: string): TicketViewEstimate | undefined;
  save(item: TicketViewEstimate): void;
  remove(code: string): boolean;
  list(): TicketViewEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewEstimateStore implements TicketViewEstimateStore {
  items: Map<string, TicketViewEstimate>;
  order: string[];

  constructor(items: Map<string, TicketViewEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewEstimate): void {
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

  list(): TicketViewEstimate[] {
    const out: TicketViewEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewEstimateStore(): TicketViewEstimateStore {
  return new MemoryTicketViewEstimateStore(new Map<string, TicketViewEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewEstimateStore implements TicketViewEstimateStore {
  inner: TicketViewEstimateStore;
  cache: cache.TtlCache<TicketViewEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewEstimateStore,
    cacheValue: cache.TtlCache<TicketViewEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewEstimate | undefined {
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

  save(item: TicketViewEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewEstimate[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewEstimateStore(inner: TicketViewEstimateStore, ttl: number, clockValue: clock.Clock): TicketViewEstimateStore {
  return new CachedTicketViewEstimateStore(inner, cache.newTtlCache<TicketViewEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects ticket view estimates. Empty fields match all. */
export class TicketViewEstimateQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewEstimate[]): TicketViewEstimate[] {
    const matched = collections.filter(items, (candidate: TicketViewEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewEstimates(store: TicketViewEstimateStore, query: TicketViewEstimateQuery): TicketViewEstimate[] {
  return query.apply(store.list());
}

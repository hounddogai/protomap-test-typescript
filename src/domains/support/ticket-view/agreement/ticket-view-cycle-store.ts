import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewCycle } from "./ticket-view-cycle.js";

/** Keeps ticket view cycles by code. */
export interface TicketViewCycleStore {
  find(code: string): TicketViewCycle | undefined;
  save(item: TicketViewCycle): void;
  remove(code: string): boolean;
  list(): TicketViewCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewCycleStore implements TicketViewCycleStore {
  items: Map<string, TicketViewCycle>;
  order: string[];

  constructor(items: Map<string, TicketViewCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewCycle): void {
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

  list(): TicketViewCycle[] {
    const out: TicketViewCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewCycleStore(): TicketViewCycleStore {
  return new MemoryTicketViewCycleStore(new Map<string, TicketViewCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewCycleStore implements TicketViewCycleStore {
  inner: TicketViewCycleStore;
  cache: cache.TtlCache<TicketViewCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewCycleStore,
    cacheValue: cache.TtlCache<TicketViewCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewCycle | undefined {
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

  save(item: TicketViewCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewCycle[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewCycleStore(inner: TicketViewCycleStore, ttl: number, clockValue: clock.Clock): TicketViewCycleStore {
  return new CachedTicketViewCycleStore(inner, cache.newTtlCache<TicketViewCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects ticket view cycles. Empty fields match all. */
export class TicketViewCycleQuery {
  region: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewCycle): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewCycle[]): TicketViewCycle[] {
    const matched = collections.filter(items, (candidate: TicketViewCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewCycles(store: TicketViewCycleStore, query: TicketViewCycleQuery): TicketViewCycle[] {
  return query.apply(store.list());
}

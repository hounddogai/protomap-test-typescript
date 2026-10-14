import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictTicketViewSlot } from "./strict-ticket-view-slot.js";

/** Keeps strict ticket view slots by code. */
export interface StrictTicketViewSlotStore {
  find(code: string): StrictTicketViewSlot | undefined;
  save(item: StrictTicketViewSlot): void;
  remove(code: string): boolean;
  list(): StrictTicketViewSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictTicketViewSlotStore implements StrictTicketViewSlotStore {
  items: Map<string, StrictTicketViewSlot>;
  order: string[];

  constructor(items: Map<string, StrictTicketViewSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictTicketViewSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictTicketViewSlot): void {
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

  list(): StrictTicketViewSlot[] {
    const out: StrictTicketViewSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictTicketViewSlotStore(): StrictTicketViewSlotStore {
  return new MemoryStrictTicketViewSlotStore(new Map<string, StrictTicketViewSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictTicketViewSlotStore implements StrictTicketViewSlotStore {
  inner: StrictTicketViewSlotStore;
  cache: cache.TtlCache<StrictTicketViewSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictTicketViewSlotStore,
    cacheValue: cache.TtlCache<StrictTicketViewSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictTicketViewSlot | undefined {
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

  save(item: StrictTicketViewSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictTicketViewSlot[] {
    return this.inner.list();
  }
}

export function newCachedStrictTicketViewSlotStore(inner: StrictTicketViewSlotStore, ttl: number, clockValue: clock.Clock): StrictTicketViewSlotStore {
  return new CachedStrictTicketViewSlotStore(inner, cache.newTtlCache<StrictTicketViewSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects strict ticket view slots. Empty fields match all. */
export class StrictTicketViewSlotQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictTicketViewSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictTicketViewSlot[]): StrictTicketViewSlot[] {
    const matched = collections.filter(items, (candidate: StrictTicketViewSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictTicketViewSlots(store: StrictTicketViewSlotStore, query: StrictTicketViewSlotQuery): StrictTicketViewSlot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientTicketViewSlot } from "./lenient-ticket-view-slot.js";

/** Keeps lenient ticket view slots by code. */
export interface LenientTicketViewSlotStore {
  find(code: string): LenientTicketViewSlot | undefined;
  save(item: LenientTicketViewSlot): void;
  remove(code: string): boolean;
  list(): LenientTicketViewSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientTicketViewSlotStore implements LenientTicketViewSlotStore {
  items: Map<string, LenientTicketViewSlot>;
  order: string[];

  constructor(items: Map<string, LenientTicketViewSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientTicketViewSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientTicketViewSlot): void {
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

  list(): LenientTicketViewSlot[] {
    const out: LenientTicketViewSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientTicketViewSlotStore(): LenientTicketViewSlotStore {
  return new MemoryLenientTicketViewSlotStore(new Map<string, LenientTicketViewSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientTicketViewSlotStore implements LenientTicketViewSlotStore {
  inner: LenientTicketViewSlotStore;
  cache: cache.TtlCache<LenientTicketViewSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientTicketViewSlotStore,
    cacheValue: cache.TtlCache<LenientTicketViewSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientTicketViewSlot | undefined {
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

  save(item: LenientTicketViewSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientTicketViewSlot[] {
    return this.inner.list();
  }
}

export function newCachedLenientTicketViewSlotStore(inner: LenientTicketViewSlotStore, ttl: number, clockValue: clock.Clock): LenientTicketViewSlotStore {
  return new CachedLenientTicketViewSlotStore(
    inner,
    cache.newTtlCache<LenientTicketViewSlot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient ticket view slots. Empty fields match all. */
export class LenientTicketViewSlotQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientTicketViewSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientTicketViewSlot[]): LenientTicketViewSlot[] {
    const matched = collections.filter(items, (candidate: LenientTicketViewSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientTicketViewSlots(store: LenientTicketViewSlotStore, query: LenientTicketViewSlotQuery): LenientTicketViewSlot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutSlot } from "./opt-out-slot.js";

/** Keeps opt out slots by code. */
export interface OptOutSlotStore {
  find(code: string): OptOutSlot | undefined;
  save(item: OptOutSlot): void;
  remove(code: string): boolean;
  list(): OptOutSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutSlotStore implements OptOutSlotStore {
  items: Map<string, OptOutSlot>;
  order: string[];

  constructor(items: Map<string, OptOutSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutSlot): void {
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

  list(): OptOutSlot[] {
    const out: OptOutSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutSlotStore(): OptOutSlotStore {
  return new MemoryOptOutSlotStore(new Map<string, OptOutSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutSlotStore implements OptOutSlotStore {
  inner: OptOutSlotStore;
  cache: cache.TtlCache<OptOutSlot>;
  hits: number;
  misses: number;

  constructor(inner: OptOutSlotStore, cacheValue: cache.TtlCache<OptOutSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutSlot | undefined {
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

  save(item: OptOutSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutSlot[] {
    return this.inner.list();
  }
}

export function newCachedOptOutSlotStore(inner: OptOutSlotStore, ttl: number, clockValue: clock.Clock): OptOutSlotStore {
  return new CachedOptOutSlotStore(inner, cache.newTtlCache<OptOutSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects opt out slots. Empty fields match all. */
export class OptOutSlotQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutSlot[]): OptOutSlot[] {
    const matched = collections.filter(items, (candidate: OptOutSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutSlots(store: OptOutSlotStore, query: OptOutSlotQuery): OptOutSlot[] {
  return query.apply(store.list());
}

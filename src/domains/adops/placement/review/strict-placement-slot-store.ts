import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPlacementSlot } from "./strict-placement-slot.js";

/** Keeps strict placement slots by code. */
export interface StrictPlacementSlotStore {
  find(code: string): StrictPlacementSlot | undefined;
  save(item: StrictPlacementSlot): void;
  remove(code: string): boolean;
  list(): StrictPlacementSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPlacementSlotStore implements StrictPlacementSlotStore {
  items: Map<string, StrictPlacementSlot>;
  order: string[];

  constructor(items: Map<string, StrictPlacementSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPlacementSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPlacementSlot): void {
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

  list(): StrictPlacementSlot[] {
    const out: StrictPlacementSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPlacementSlotStore(): StrictPlacementSlotStore {
  return new MemoryStrictPlacementSlotStore(new Map<string, StrictPlacementSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPlacementSlotStore implements StrictPlacementSlotStore {
  inner: StrictPlacementSlotStore;
  cache: cache.TtlCache<StrictPlacementSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPlacementSlotStore,
    cacheValue: cache.TtlCache<StrictPlacementSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPlacementSlot | undefined {
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

  save(item: StrictPlacementSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPlacementSlot[] {
    return this.inner.list();
  }
}

export function newCachedStrictPlacementSlotStore(inner: StrictPlacementSlotStore, ttl: number, clockValue: clock.Clock): StrictPlacementSlotStore {
  return new CachedStrictPlacementSlotStore(inner, cache.newTtlCache<StrictPlacementSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects strict placement slots. Empty fields match all. */
export class StrictPlacementSlotQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPlacementSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPlacementSlot[]): StrictPlacementSlot[] {
    const matched = collections.filter(items, (candidate: StrictPlacementSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPlacementSlots(store: StrictPlacementSlotStore, query: StrictPlacementSlotQuery): StrictPlacementSlot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementSlot } from "./placement-slot.js";

/** Keeps placement slots by code. */
export interface PlacementSlotStore {
  find(code: string): PlacementSlot | undefined;
  save(item: PlacementSlot): void;
  remove(code: string): boolean;
  list(): PlacementSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementSlotStore implements PlacementSlotStore {
  items: Map<string, PlacementSlot>;
  order: string[];

  constructor(items: Map<string, PlacementSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementSlot): void {
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

  list(): PlacementSlot[] {
    const out: PlacementSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementSlotStore(): PlacementSlotStore {
  return new MemoryPlacementSlotStore(new Map<string, PlacementSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementSlotStore implements PlacementSlotStore {
  inner: PlacementSlotStore;
  cache: cache.TtlCache<PlacementSlot>;
  hits: number;
  misses: number;

  constructor(inner: PlacementSlotStore, cacheValue: cache.TtlCache<PlacementSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementSlot | undefined {
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

  save(item: PlacementSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementSlot[] {
    return this.inner.list();
  }
}

export function newCachedPlacementSlotStore(inner: PlacementSlotStore, ttl: number, clockValue: clock.Clock): PlacementSlotStore {
  return new CachedPlacementSlotStore(inner, cache.newTtlCache<PlacementSlot>(512, ttl, clockValue), 0, 0);
}

/** Selects placement slots. Empty fields match all. */
export class PlacementSlotQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementSlot[]): PlacementSlot[] {
    const matched = collections.filter(items, (candidate: PlacementSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementSlots(store: PlacementSlotStore, query: PlacementSlotQuery): PlacementSlot[] {
  return query.apply(store.list());
}

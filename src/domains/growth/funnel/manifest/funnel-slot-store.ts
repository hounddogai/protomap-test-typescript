import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelSlot } from "./funnel-slot.js";

/** Keeps funnel slots by code. */
export interface FunnelSlotStore {
  find(code: string): FunnelSlot | undefined;
  save(item: FunnelSlot): void;
  remove(code: string): boolean;
  list(): FunnelSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelSlotStore implements FunnelSlotStore {
  items: Map<string, FunnelSlot>;
  order: string[];

  constructor(items: Map<string, FunnelSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelSlot): void {
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

  list(): FunnelSlot[] {
    const out: FunnelSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelSlotStore(): FunnelSlotStore {
  return new MemoryFunnelSlotStore(new Map<string, FunnelSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelSlotStore implements FunnelSlotStore {
  inner: FunnelSlotStore;
  cache: cache.TtlCache<FunnelSlot>;
  hits: number;
  misses: number;

  constructor(inner: FunnelSlotStore, cacheValue: cache.TtlCache<FunnelSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelSlot | undefined {
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

  save(item: FunnelSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelSlot[] {
    return this.inner.list();
  }
}

export function newCachedFunnelSlotStore(inner: FunnelSlotStore, ttl: number, clockValue: clock.Clock): FunnelSlotStore {
  return new CachedFunnelSlotStore(inner, cache.newTtlCache<FunnelSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects funnel slots. Empty fields match all. */
export class FunnelSlotQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelSlot[]): FunnelSlot[] {
    const matched = collections.filter(items, (candidate: FunnelSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelSlots(store: FunnelSlotStore, query: FunnelSlotQuery): FunnelSlot[] {
  return query.apply(store.list());
}

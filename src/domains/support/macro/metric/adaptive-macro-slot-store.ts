import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveMacroSlot } from "./adaptive-macro-slot.js";

/** Keeps adaptive macro slots by code. */
export interface AdaptiveMacroSlotStore {
  find(code: string): AdaptiveMacroSlot | undefined;
  save(item: AdaptiveMacroSlot): void;
  remove(code: string): boolean;
  list(): AdaptiveMacroSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveMacroSlotStore implements AdaptiveMacroSlotStore {
  items: Map<string, AdaptiveMacroSlot>;
  order: string[];

  constructor(items: Map<string, AdaptiveMacroSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveMacroSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveMacroSlot): void {
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

  list(): AdaptiveMacroSlot[] {
    const out: AdaptiveMacroSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveMacroSlotStore(): AdaptiveMacroSlotStore {
  return new MemoryAdaptiveMacroSlotStore(new Map<string, AdaptiveMacroSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveMacroSlotStore implements AdaptiveMacroSlotStore {
  inner: AdaptiveMacroSlotStore;
  cache: cache.TtlCache<AdaptiveMacroSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveMacroSlotStore,
    cacheValue: cache.TtlCache<AdaptiveMacroSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveMacroSlot | undefined {
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

  save(item: AdaptiveMacroSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveMacroSlot[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveMacroSlotStore(inner: AdaptiveMacroSlotStore, ttl: number, clockValue: clock.Clock): AdaptiveMacroSlotStore {
  return new CachedAdaptiveMacroSlotStore(inner, cache.newTtlCache<AdaptiveMacroSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects adaptive macro slots. Empty fields match all. */
export class AdaptiveMacroSlotQuery {
  category: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCapacity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveMacroSlot): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveMacroSlot[]): AdaptiveMacroSlot[] {
    const matched = collections.filter(items, (candidate: AdaptiveMacroSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveMacroSlots(store: AdaptiveMacroSlotStore, query: AdaptiveMacroSlotQuery): AdaptiveMacroSlot[] {
  return query.apply(store.list());
}

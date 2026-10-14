import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePlacementSlot } from "./adaptive-placement-slot.js";

/** Keeps adaptive placement slots by code. */
export interface AdaptivePlacementSlotStore {
  find(code: string): AdaptivePlacementSlot | undefined;
  save(item: AdaptivePlacementSlot): void;
  remove(code: string): boolean;
  list(): AdaptivePlacementSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePlacementSlotStore implements AdaptivePlacementSlotStore {
  items: Map<string, AdaptivePlacementSlot>;
  order: string[];

  constructor(items: Map<string, AdaptivePlacementSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePlacementSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePlacementSlot): void {
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

  list(): AdaptivePlacementSlot[] {
    const out: AdaptivePlacementSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePlacementSlotStore(): AdaptivePlacementSlotStore {
  return new MemoryAdaptivePlacementSlotStore(new Map<string, AdaptivePlacementSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePlacementSlotStore implements AdaptivePlacementSlotStore {
  inner: AdaptivePlacementSlotStore;
  cache: cache.TtlCache<AdaptivePlacementSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePlacementSlotStore,
    cacheValue: cache.TtlCache<AdaptivePlacementSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePlacementSlot | undefined {
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

  save(item: AdaptivePlacementSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePlacementSlot[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePlacementSlotStore(inner: AdaptivePlacementSlotStore, ttl: number, clockValue: clock.Clock): AdaptivePlacementSlotStore {
  return new CachedAdaptivePlacementSlotStore(
    inner,
    cache.newTtlCache<AdaptivePlacementSlot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive placement slots. Empty fields match all. */
export class AdaptivePlacementSlotQuery {
  category: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSequence: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePlacementSlot): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePlacementSlot[]): AdaptivePlacementSlot[] {
    const matched = collections.filter(items, (candidate: AdaptivePlacementSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePlacementSlots(store: AdaptivePlacementSlotStore, query: AdaptivePlacementSlotQuery): AdaptivePlacementSlot[] {
  return query.apply(store.list());
}

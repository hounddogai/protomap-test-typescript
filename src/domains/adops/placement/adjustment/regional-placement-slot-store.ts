import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPlacementSlot } from "./regional-placement-slot.js";

/** Keeps regional placement slots by code. */
export interface RegionalPlacementSlotStore {
  find(code: string): RegionalPlacementSlot | undefined;
  save(item: RegionalPlacementSlot): void;
  remove(code: string): boolean;
  list(): RegionalPlacementSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPlacementSlotStore implements RegionalPlacementSlotStore {
  items: Map<string, RegionalPlacementSlot>;
  order: string[];

  constructor(items: Map<string, RegionalPlacementSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPlacementSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPlacementSlot): void {
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

  list(): RegionalPlacementSlot[] {
    const out: RegionalPlacementSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPlacementSlotStore(): RegionalPlacementSlotStore {
  return new MemoryRegionalPlacementSlotStore(new Map<string, RegionalPlacementSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPlacementSlotStore implements RegionalPlacementSlotStore {
  inner: RegionalPlacementSlotStore;
  cache: cache.TtlCache<RegionalPlacementSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPlacementSlotStore,
    cacheValue: cache.TtlCache<RegionalPlacementSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPlacementSlot | undefined {
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

  save(item: RegionalPlacementSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPlacementSlot[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPlacementSlotStore(inner: RegionalPlacementSlotStore, ttl: number, clockValue: clock.Clock): RegionalPlacementSlotStore {
  return new CachedRegionalPlacementSlotStore(
    inner,
    cache.newTtlCache<RegionalPlacementSlot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional placement slots. Empty fields match all. */
export class RegionalPlacementSlotQuery {
  country: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minLimit: number, statuses: string[], limit: number) {
    this.country = country;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPlacementSlot): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPlacementSlot[]): RegionalPlacementSlot[] {
    const matched = collections.filter(items, (candidate: RegionalPlacementSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPlacementSlots(store: RegionalPlacementSlotStore, query: RegionalPlacementSlotQuery): RegionalPlacementSlot[] {
  return query.apply(store.list());
}

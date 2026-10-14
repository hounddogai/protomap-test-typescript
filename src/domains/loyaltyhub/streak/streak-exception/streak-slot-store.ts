import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakSlot } from "./streak-slot.js";

/** Keeps streak slots by code. */
export interface StreakSlotStore {
  find(code: string): StreakSlot | undefined;
  save(item: StreakSlot): void;
  remove(code: string): boolean;
  list(): StreakSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakSlotStore implements StreakSlotStore {
  items: Map<string, StreakSlot>;
  order: string[];

  constructor(items: Map<string, StreakSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakSlot): void {
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

  list(): StreakSlot[] {
    const out: StreakSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakSlotStore(): StreakSlotStore {
  return new MemoryStreakSlotStore(new Map<string, StreakSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakSlotStore implements StreakSlotStore {
  inner: StreakSlotStore;
  cache: cache.TtlCache<StreakSlot>;
  hits: number;
  misses: number;

  constructor(inner: StreakSlotStore, cacheValue: cache.TtlCache<StreakSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakSlot | undefined {
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

  save(item: StreakSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakSlot[] {
    return this.inner.list();
  }
}

export function newCachedStreakSlotStore(inner: StreakSlotStore, ttl: number, clockValue: clock.Clock): StreakSlotStore {
  return new CachedStreakSlotStore(inner, cache.newTtlCache<StreakSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects streak slots. Empty fields match all. */
export class StreakSlotQuery {
  region: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFloorValue: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakSlot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakSlot[]): StreakSlot[] {
    const matched = collections.filter(items, (candidate: StreakSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakSlots(store: StreakSlotStore, query: StreakSlotQuery): StreakSlot[] {
  return query.apply(store.list());
}

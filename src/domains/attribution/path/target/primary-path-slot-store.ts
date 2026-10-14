import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPathSlot } from "./primary-path-slot.js";

/** Keeps primary path slots by code. */
export interface PrimaryPathSlotStore {
  find(code: string): PrimaryPathSlot | undefined;
  save(item: PrimaryPathSlot): void;
  remove(code: string): boolean;
  list(): PrimaryPathSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPathSlotStore implements PrimaryPathSlotStore {
  items: Map<string, PrimaryPathSlot>;
  order: string[];

  constructor(items: Map<string, PrimaryPathSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPathSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPathSlot): void {
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

  list(): PrimaryPathSlot[] {
    const out: PrimaryPathSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPathSlotStore(): PrimaryPathSlotStore {
  return new MemoryPrimaryPathSlotStore(new Map<string, PrimaryPathSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPathSlotStore implements PrimaryPathSlotStore {
  inner: PrimaryPathSlotStore;
  cache: cache.TtlCache<PrimaryPathSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPathSlotStore,
    cacheValue: cache.TtlCache<PrimaryPathSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPathSlot | undefined {
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

  save(item: PrimaryPathSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPathSlot[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPathSlotStore(inner: PrimaryPathSlotStore, ttl: number, clockValue: clock.Clock): PrimaryPathSlotStore {
  return new CachedPrimaryPathSlotStore(inner, cache.newTtlCache<PrimaryPathSlot>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary path slots. Empty fields match all. */
export class PrimaryPathSlotQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPathSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPathSlot[]): PrimaryPathSlot[] {
    const matched = collections.filter(items, (candidate: PrimaryPathSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPathSlots(store: PrimaryPathSlotStore, query: PrimaryPathSlotQuery): PrimaryPathSlot[] {
  return query.apply(store.list());
}

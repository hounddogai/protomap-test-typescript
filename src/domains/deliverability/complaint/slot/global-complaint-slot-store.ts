import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalComplaintSlot } from "./global-complaint-slot.js";

/** Keeps global complaint slots by code. */
export interface GlobalComplaintSlotStore {
  find(code: string): GlobalComplaintSlot | undefined;
  save(item: GlobalComplaintSlot): void;
  remove(code: string): boolean;
  list(): GlobalComplaintSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalComplaintSlotStore implements GlobalComplaintSlotStore {
  items: Map<string, GlobalComplaintSlot>;
  order: string[];

  constructor(items: Map<string, GlobalComplaintSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalComplaintSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalComplaintSlot): void {
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

  list(): GlobalComplaintSlot[] {
    const out: GlobalComplaintSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalComplaintSlotStore(): GlobalComplaintSlotStore {
  return new MemoryGlobalComplaintSlotStore(new Map<string, GlobalComplaintSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalComplaintSlotStore implements GlobalComplaintSlotStore {
  inner: GlobalComplaintSlotStore;
  cache: cache.TtlCache<GlobalComplaintSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalComplaintSlotStore,
    cacheValue: cache.TtlCache<GlobalComplaintSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalComplaintSlot | undefined {
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

  save(item: GlobalComplaintSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalComplaintSlot[] {
    return this.inner.list();
  }
}

export function newCachedGlobalComplaintSlotStore(inner: GlobalComplaintSlotStore, ttl: number, clockValue: clock.Clock): GlobalComplaintSlotStore {
  return new CachedGlobalComplaintSlotStore(inner, cache.newTtlCache<GlobalComplaintSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects global complaint slots. Empty fields match all. */
export class GlobalComplaintSlotQuery {
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

  matches(item: GlobalComplaintSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalComplaintSlot[]): GlobalComplaintSlot[] {
    const matched = collections.filter(items, (candidate: GlobalComplaintSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalComplaintSlots(store: GlobalComplaintSlotStore, query: GlobalComplaintSlotQuery): GlobalComplaintSlot[] {
  return query.apply(store.list());
}

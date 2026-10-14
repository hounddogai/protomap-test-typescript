import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalOptOutSlot } from "./global-opt-out-slot.js";

/** Keeps global opt out slots by code. */
export interface GlobalOptOutSlotStore {
  find(code: string): GlobalOptOutSlot | undefined;
  save(item: GlobalOptOutSlot): void;
  remove(code: string): boolean;
  list(): GlobalOptOutSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalOptOutSlotStore implements GlobalOptOutSlotStore {
  items: Map<string, GlobalOptOutSlot>;
  order: string[];

  constructor(items: Map<string, GlobalOptOutSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalOptOutSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalOptOutSlot): void {
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

  list(): GlobalOptOutSlot[] {
    const out: GlobalOptOutSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalOptOutSlotStore(): GlobalOptOutSlotStore {
  return new MemoryGlobalOptOutSlotStore(new Map<string, GlobalOptOutSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalOptOutSlotStore implements GlobalOptOutSlotStore {
  inner: GlobalOptOutSlotStore;
  cache: cache.TtlCache<GlobalOptOutSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalOptOutSlotStore,
    cacheValue: cache.TtlCache<GlobalOptOutSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalOptOutSlot | undefined {
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

  save(item: GlobalOptOutSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalOptOutSlot[] {
    return this.inner.list();
  }
}

export function newCachedGlobalOptOutSlotStore(inner: GlobalOptOutSlotStore, ttl: number, clockValue: clock.Clock): GlobalOptOutSlotStore {
  return new CachedGlobalOptOutSlotStore(inner, cache.newTtlCache<GlobalOptOutSlot>(128, ttl, clockValue), 0, 0);
}

/** Selects global opt out slots. Empty fields match all. */
export class GlobalOptOutSlotQuery {
  source: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWindowDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalOptOutSlot): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalOptOutSlot[]): GlobalOptOutSlot[] {
    const matched = collections.filter(items, (candidate: GlobalOptOutSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalOptOutSlots(store: GlobalOptOutSlotStore, query: GlobalOptOutSlotQuery): GlobalOptOutSlot[] {
  return query.apply(store.list());
}

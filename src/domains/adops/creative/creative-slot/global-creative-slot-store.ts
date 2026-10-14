import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalCreativeSlot } from "./global-creative-slot.js";

/** Keeps global creative slots by code. */
export interface GlobalCreativeSlotStore {
  find(code: string): GlobalCreativeSlot | undefined;
  save(item: GlobalCreativeSlot): void;
  remove(code: string): boolean;
  list(): GlobalCreativeSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalCreativeSlotStore implements GlobalCreativeSlotStore {
  items: Map<string, GlobalCreativeSlot>;
  order: string[];

  constructor(items: Map<string, GlobalCreativeSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalCreativeSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalCreativeSlot): void {
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

  list(): GlobalCreativeSlot[] {
    const out: GlobalCreativeSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalCreativeSlotStore(): GlobalCreativeSlotStore {
  return new MemoryGlobalCreativeSlotStore(new Map<string, GlobalCreativeSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalCreativeSlotStore implements GlobalCreativeSlotStore {
  inner: GlobalCreativeSlotStore;
  cache: cache.TtlCache<GlobalCreativeSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalCreativeSlotStore,
    cacheValue: cache.TtlCache<GlobalCreativeSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalCreativeSlot | undefined {
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

  save(item: GlobalCreativeSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalCreativeSlot[] {
    return this.inner.list();
  }
}

export function newCachedGlobalCreativeSlotStore(inner: GlobalCreativeSlotStore, ttl: number, clockValue: clock.Clock): GlobalCreativeSlotStore {
  return new CachedGlobalCreativeSlotStore(inner, cache.newTtlCache<GlobalCreativeSlot>(512, ttl, clockValue), 0, 0);
}

/** Selects global creative slots. Empty fields match all. */
export class GlobalCreativeSlotQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalCreativeSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalCreativeSlot[]): GlobalCreativeSlot[] {
    const matched = collections.filter(items, (candidate: GlobalCreativeSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalCreativeSlots(store: GlobalCreativeSlotStore, query: GlobalCreativeSlotQuery): GlobalCreativeSlot[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBadgeSlot } from "./pending-badge-slot.js";

/** Keeps pending badge slots by code. */
export interface PendingBadgeSlotStore {
  find(code: string): PendingBadgeSlot | undefined;
  save(item: PendingBadgeSlot): void;
  remove(code: string): boolean;
  list(): PendingBadgeSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBadgeSlotStore implements PendingBadgeSlotStore {
  items: Map<string, PendingBadgeSlot>;
  order: string[];

  constructor(items: Map<string, PendingBadgeSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBadgeSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBadgeSlot): void {
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

  list(): PendingBadgeSlot[] {
    const out: PendingBadgeSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBadgeSlotStore(): PendingBadgeSlotStore {
  return new MemoryPendingBadgeSlotStore(new Map<string, PendingBadgeSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBadgeSlotStore implements PendingBadgeSlotStore {
  inner: PendingBadgeSlotStore;
  cache: cache.TtlCache<PendingBadgeSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBadgeSlotStore,
    cacheValue: cache.TtlCache<PendingBadgeSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBadgeSlot | undefined {
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

  save(item: PendingBadgeSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBadgeSlot[] {
    return this.inner.list();
  }
}

export function newCachedPendingBadgeSlotStore(inner: PendingBadgeSlotStore, ttl: number, clockValue: clock.Clock): PendingBadgeSlotStore {
  return new CachedPendingBadgeSlotStore(inner, cache.newTtlCache<PendingBadgeSlot>(256, ttl, clockValue), 0, 0);
}

/** Selects pending badge slots. Empty fields match all. */
export class PendingBadgeSlotQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBadgeSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBadgeSlot[]): PendingBadgeSlot[] {
    const matched = collections.filter(items, (candidate: PendingBadgeSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBadgeSlots(store: PendingBadgeSlotStore, query: PendingBadgeSlotQuery): PendingBadgeSlot[] {
  return query.apply(store.list());
}

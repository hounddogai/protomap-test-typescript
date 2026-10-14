import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFlightSlot } from "./scheduled-flight-slot.js";

/** Keeps scheduled flight slots by code. */
export interface ScheduledFlightSlotStore {
  find(code: string): ScheduledFlightSlot | undefined;
  save(item: ScheduledFlightSlot): void;
  remove(code: string): boolean;
  list(): ScheduledFlightSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFlightSlotStore implements ScheduledFlightSlotStore {
  items: Map<string, ScheduledFlightSlot>;
  order: string[];

  constructor(items: Map<string, ScheduledFlightSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFlightSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFlightSlot): void {
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

  list(): ScheduledFlightSlot[] {
    const out: ScheduledFlightSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFlightSlotStore(): ScheduledFlightSlotStore {
  return new MemoryScheduledFlightSlotStore(new Map<string, ScheduledFlightSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFlightSlotStore implements ScheduledFlightSlotStore {
  inner: ScheduledFlightSlotStore;
  cache: cache.TtlCache<ScheduledFlightSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFlightSlotStore,
    cacheValue: cache.TtlCache<ScheduledFlightSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFlightSlot | undefined {
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

  save(item: ScheduledFlightSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFlightSlot[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFlightSlotStore(inner: ScheduledFlightSlotStore, ttl: number, clockValue: clock.Clock): ScheduledFlightSlotStore {
  return new CachedScheduledFlightSlotStore(inner, cache.newTtlCache<ScheduledFlightSlot>(512, ttl, clockValue), 0, 0);
}

/** Selects scheduled flight slots. Empty fields match all. */
export class ScheduledFlightSlotQuery {
  locale: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFlightSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFlightSlot[]): ScheduledFlightSlot[] {
    const matched = collections.filter(items, (candidate: ScheduledFlightSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFlightSlots(store: ScheduledFlightSlotStore, query: ScheduledFlightSlotQuery): ScheduledFlightSlot[] {
  return query.apply(store.list());
}

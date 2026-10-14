import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledOptOutSlot } from "./scheduled-opt-out-slot.js";

/** Keeps scheduled opt out slots by code. */
export interface ScheduledOptOutSlotStore {
  find(code: string): ScheduledOptOutSlot | undefined;
  save(item: ScheduledOptOutSlot): void;
  remove(code: string): boolean;
  list(): ScheduledOptOutSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledOptOutSlotStore implements ScheduledOptOutSlotStore {
  items: Map<string, ScheduledOptOutSlot>;
  order: string[];

  constructor(items: Map<string, ScheduledOptOutSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledOptOutSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledOptOutSlot): void {
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

  list(): ScheduledOptOutSlot[] {
    const out: ScheduledOptOutSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledOptOutSlotStore(): ScheduledOptOutSlotStore {
  return new MemoryScheduledOptOutSlotStore(new Map<string, ScheduledOptOutSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledOptOutSlotStore implements ScheduledOptOutSlotStore {
  inner: ScheduledOptOutSlotStore;
  cache: cache.TtlCache<ScheduledOptOutSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledOptOutSlotStore,
    cacheValue: cache.TtlCache<ScheduledOptOutSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledOptOutSlot | undefined {
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

  save(item: ScheduledOptOutSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledOptOutSlot[] {
    return this.inner.list();
  }
}

export function newCachedScheduledOptOutSlotStore(inner: ScheduledOptOutSlotStore, ttl: number, clockValue: clock.Clock): ScheduledOptOutSlotStore {
  return new CachedScheduledOptOutSlotStore(inner, cache.newTtlCache<ScheduledOptOutSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects scheduled opt out slots. Empty fields match all. */
export class ScheduledOptOutSlotQuery {
  unit: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMaximum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledOptOutSlot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledOptOutSlot[]): ScheduledOptOutSlot[] {
    const matched = collections.filter(items, (candidate: ScheduledOptOutSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledOptOutSlots(store: ScheduledOptOutSlotStore, query: ScheduledOptOutSlotQuery): ScheduledOptOutSlot[] {
  return query.apply(store.list());
}

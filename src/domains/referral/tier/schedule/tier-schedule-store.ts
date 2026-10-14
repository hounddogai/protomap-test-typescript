import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierSchedule } from "./tier-schedule.js";

/** Keeps tier schedules by code. */
export interface TierScheduleStore {
  find(code: string): TierSchedule | undefined;
  save(item: TierSchedule): void;
  remove(code: string): boolean;
  list(): TierSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierScheduleStore implements TierScheduleStore {
  items: Map<string, TierSchedule>;
  order: string[];

  constructor(items: Map<string, TierSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierSchedule): void {
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

  list(): TierSchedule[] {
    const out: TierSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierScheduleStore(): TierScheduleStore {
  return new MemoryTierScheduleStore(new Map<string, TierSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierScheduleStore implements TierScheduleStore {
  inner: TierScheduleStore;
  cache: cache.TtlCache<TierSchedule>;
  hits: number;
  misses: number;

  constructor(inner: TierScheduleStore, cacheValue: cache.TtlCache<TierSchedule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierSchedule | undefined {
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

  save(item: TierSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierSchedule[] {
    return this.inner.list();
  }
}

export function newCachedTierScheduleStore(inner: TierScheduleStore, ttl: number, clockValue: clock.Clock): TierScheduleStore {
  return new CachedTierScheduleStore(inner, cache.newTtlCache<TierSchedule>(512, ttl, clockValue), 0, 0);
}

/** Selects tier schedules. Empty fields match all. */
export class TierScheduleQuery {
  unit: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minQuantity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierSchedule): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierSchedule[]): TierSchedule[] {
    const matched = collections.filter(items, (candidate: TierSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierSchedules(store: TierScheduleStore, query: TierScheduleQuery): TierSchedule[] {
  return query.apply(store.list());
}

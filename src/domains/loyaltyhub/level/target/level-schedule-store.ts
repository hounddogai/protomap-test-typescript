import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelSchedule } from "./level-schedule.js";

/** Keeps level schedules by code. */
export interface LevelScheduleStore {
  find(code: string): LevelSchedule | undefined;
  save(item: LevelSchedule): void;
  remove(code: string): boolean;
  list(): LevelSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelScheduleStore implements LevelScheduleStore {
  items: Map<string, LevelSchedule>;
  order: string[];

  constructor(items: Map<string, LevelSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelSchedule): void {
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

  list(): LevelSchedule[] {
    const out: LevelSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelScheduleStore(): LevelScheduleStore {
  return new MemoryLevelScheduleStore(new Map<string, LevelSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelScheduleStore implements LevelScheduleStore {
  inner: LevelScheduleStore;
  cache: cache.TtlCache<LevelSchedule>;
  hits: number;
  misses: number;

  constructor(inner: LevelScheduleStore, cacheValue: cache.TtlCache<LevelSchedule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelSchedule | undefined {
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

  save(item: LevelSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelSchedule[] {
    return this.inner.list();
  }
}

export function newCachedLevelScheduleStore(inner: LevelScheduleStore, ttl: number, clockValue: clock.Clock): LevelScheduleStore {
  return new CachedLevelScheduleStore(inner, cache.newTtlCache<LevelSchedule>(1024, ttl, clockValue), 0, 0);
}

/** Selects level schedules. Empty fields match all. */
export class LevelScheduleQuery {
  country: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minDiscount: number, statuses: string[], limit: number) {
    this.country = country;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelSchedule): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelSchedule[]): LevelSchedule[] {
    const matched = collections.filter(items, (candidate: LevelSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelSchedules(store: LevelScheduleStore, query: LevelScheduleQuery): LevelSchedule[] {
  return query.apply(store.list());
}

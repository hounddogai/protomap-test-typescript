import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakSchedule } from "./streak-schedule.js";

/** Keeps streak schedules by code. */
export interface StreakScheduleStore {
  find(code: string): StreakSchedule | undefined;
  save(item: StreakSchedule): void;
  remove(code: string): boolean;
  list(): StreakSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakScheduleStore implements StreakScheduleStore {
  items: Map<string, StreakSchedule>;
  order: string[];

  constructor(items: Map<string, StreakSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakSchedule): void {
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

  list(): StreakSchedule[] {
    const out: StreakSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakScheduleStore(): StreakScheduleStore {
  return new MemoryStreakScheduleStore(new Map<string, StreakSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakScheduleStore implements StreakScheduleStore {
  inner: StreakScheduleStore;
  cache: cache.TtlCache<StreakSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: StreakScheduleStore,
    cacheValue: cache.TtlCache<StreakSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakSchedule | undefined {
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

  save(item: StreakSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakSchedule[] {
    return this.inner.list();
  }
}

export function newCachedStreakScheduleStore(inner: StreakScheduleStore, ttl: number, clockValue: clock.Clock): StreakScheduleStore {
  return new CachedStreakScheduleStore(inner, cache.newTtlCache<StreakSchedule>(64, ttl, clockValue), 0, 0);
}

/** Selects streak schedules. Empty fields match all. */
export class StreakScheduleQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakSchedule[]): StreakSchedule[] {
    const matched = collections.filter(items, (candidate: StreakSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakSchedules(store: StreakScheduleStore, query: StreakScheduleQuery): StreakSchedule[] {
  return query.apply(store.list());
}

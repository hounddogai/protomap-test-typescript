import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCohortSchedule } from "./scheduled-cohort-schedule.js";

/** Keeps scheduled cohort schedules by code. */
export interface ScheduledCohortScheduleStore {
  find(code: string): ScheduledCohortSchedule | undefined;
  save(item: ScheduledCohortSchedule): void;
  remove(code: string): boolean;
  list(): ScheduledCohortSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCohortScheduleStore implements ScheduledCohortScheduleStore {
  items: Map<string, ScheduledCohortSchedule>;
  order: string[];

  constructor(items: Map<string, ScheduledCohortSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCohortSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCohortSchedule): void {
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

  list(): ScheduledCohortSchedule[] {
    const out: ScheduledCohortSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCohortScheduleStore(): ScheduledCohortScheduleStore {
  return new MemoryScheduledCohortScheduleStore(new Map<string, ScheduledCohortSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCohortScheduleStore implements ScheduledCohortScheduleStore {
  inner: ScheduledCohortScheduleStore;
  cache: cache.TtlCache<ScheduledCohortSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCohortScheduleStore,
    cacheValue: cache.TtlCache<ScheduledCohortSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCohortSchedule | undefined {
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

  save(item: ScheduledCohortSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCohortSchedule[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCohortScheduleStore(inner: ScheduledCohortScheduleStore, ttl: number, clockValue: clock.Clock): ScheduledCohortScheduleStore {
  return new CachedScheduledCohortScheduleStore(
    inner,
    cache.newTtlCache<ScheduledCohortSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled cohort schedules. Empty fields match all. */
export class ScheduledCohortScheduleQuery {
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

  matches(item: ScheduledCohortSchedule): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCohortSchedule[]): ScheduledCohortSchedule[] {
    const matched = collections.filter(items, (candidate: ScheduledCohortSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCohortSchedules(store: ScheduledCohortScheduleStore, query: ScheduledCohortScheduleQuery): ScheduledCohortSchedule[] {
  return query.apply(store.list());
}

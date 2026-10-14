import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictStepSchedule } from "./strict-step-schedule.js";

/** Keeps strict step schedules by code. */
export interface StrictStepScheduleStore {
  find(code: string): StrictStepSchedule | undefined;
  save(item: StrictStepSchedule): void;
  remove(code: string): boolean;
  list(): StrictStepSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictStepScheduleStore implements StrictStepScheduleStore {
  items: Map<string, StrictStepSchedule>;
  order: string[];

  constructor(items: Map<string, StrictStepSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictStepSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictStepSchedule): void {
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

  list(): StrictStepSchedule[] {
    const out: StrictStepSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictStepScheduleStore(): StrictStepScheduleStore {
  return new MemoryStrictStepScheduleStore(new Map<string, StrictStepSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictStepScheduleStore implements StrictStepScheduleStore {
  inner: StrictStepScheduleStore;
  cache: cache.TtlCache<StrictStepSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictStepScheduleStore,
    cacheValue: cache.TtlCache<StrictStepSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictStepSchedule | undefined {
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

  save(item: StrictStepSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictStepSchedule[] {
    return this.inner.list();
  }
}

export function newCachedStrictStepScheduleStore(inner: StrictStepScheduleStore, ttl: number, clockValue: clock.Clock): StrictStepScheduleStore {
  return new CachedStrictStepScheduleStore(inner, cache.newTtlCache<StrictStepSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects strict step schedules. Empty fields match all. */
export class StrictStepScheduleQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictStepSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictStepSchedule[]): StrictStepSchedule[] {
    const matched = collections.filter(items, (candidate: StrictStepSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictStepSchedules(store: StrictStepScheduleStore, query: StrictStepScheduleQuery): StrictStepSchedule[] {
  return query.apply(store.list());
}

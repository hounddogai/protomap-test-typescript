import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInSchedule } from "./double-opt-in-schedule.js";

/** Keeps double opt in schedules by code. */
export interface DoubleOptInScheduleStore {
  find(code: string): DoubleOptInSchedule | undefined;
  save(item: DoubleOptInSchedule): void;
  remove(code: string): boolean;
  list(): DoubleOptInSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInScheduleStore implements DoubleOptInScheduleStore {
  items: Map<string, DoubleOptInSchedule>;
  order: string[];

  constructor(items: Map<string, DoubleOptInSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInSchedule): void {
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

  list(): DoubleOptInSchedule[] {
    const out: DoubleOptInSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInScheduleStore(): DoubleOptInScheduleStore {
  return new MemoryDoubleOptInScheduleStore(new Map<string, DoubleOptInSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInScheduleStore implements DoubleOptInScheduleStore {
  inner: DoubleOptInScheduleStore;
  cache: cache.TtlCache<DoubleOptInSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInScheduleStore,
    cacheValue: cache.TtlCache<DoubleOptInSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInSchedule | undefined {
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

  save(item: DoubleOptInSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInSchedule[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInScheduleStore(inner: DoubleOptInScheduleStore, ttl: number, clockValue: clock.Clock): DoubleOptInScheduleStore {
  return new CachedDoubleOptInScheduleStore(inner, cache.newTtlCache<DoubleOptInSchedule>(64, ttl, clockValue), 0, 0);
}

/** Selects double opt in schedules. Empty fields match all. */
export class DoubleOptInScheduleQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInSchedule[]): DoubleOptInSchedule[] {
    const matched = collections.filter(items, (candidate: DoubleOptInSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInSchedules(store: DoubleOptInScheduleStore, query: DoubleOptInScheduleQuery): DoubleOptInSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientOptOutSchedule } from "./lenient-opt-out-schedule.js";

/** Keeps lenient opt out schedules by code. */
export interface LenientOptOutScheduleStore {
  find(code: string): LenientOptOutSchedule | undefined;
  save(item: LenientOptOutSchedule): void;
  remove(code: string): boolean;
  list(): LenientOptOutSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientOptOutScheduleStore implements LenientOptOutScheduleStore {
  items: Map<string, LenientOptOutSchedule>;
  order: string[];

  constructor(items: Map<string, LenientOptOutSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientOptOutSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientOptOutSchedule): void {
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

  list(): LenientOptOutSchedule[] {
    const out: LenientOptOutSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientOptOutScheduleStore(): LenientOptOutScheduleStore {
  return new MemoryLenientOptOutScheduleStore(new Map<string, LenientOptOutSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientOptOutScheduleStore implements LenientOptOutScheduleStore {
  inner: LenientOptOutScheduleStore;
  cache: cache.TtlCache<LenientOptOutSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientOptOutScheduleStore,
    cacheValue: cache.TtlCache<LenientOptOutSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientOptOutSchedule | undefined {
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

  save(item: LenientOptOutSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientOptOutSchedule[] {
    return this.inner.list();
  }
}

export function newCachedLenientOptOutScheduleStore(inner: LenientOptOutScheduleStore, ttl: number, clockValue: clock.Clock): LenientOptOutScheduleStore {
  return new CachedLenientOptOutScheduleStore(
    inner,
    cache.newTtlCache<LenientOptOutSchedule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient opt out schedules. Empty fields match all. */
export class LenientOptOutScheduleQuery {
  segment: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientOptOutSchedule): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientOptOutSchedule[]): LenientOptOutSchedule[] {
    const matched = collections.filter(items, (candidate: LenientOptOutSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientOptOutSchedules(store: LenientOptOutScheduleStore, query: LenientOptOutScheduleQuery): LenientOptOutSchedule[] {
  return query.apply(store.list());
}

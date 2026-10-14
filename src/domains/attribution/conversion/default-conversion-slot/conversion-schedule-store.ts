import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionSchedule } from "./conversion-schedule.js";

/** Keeps conversion schedules by code. */
export interface ConversionScheduleStore {
  find(code: string): ConversionSchedule | undefined;
  save(item: ConversionSchedule): void;
  remove(code: string): boolean;
  list(): ConversionSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionScheduleStore implements ConversionScheduleStore {
  items: Map<string, ConversionSchedule>;
  order: string[];

  constructor(items: Map<string, ConversionSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionSchedule): void {
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

  list(): ConversionSchedule[] {
    const out: ConversionSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionScheduleStore(): ConversionScheduleStore {
  return new MemoryConversionScheduleStore(new Map<string, ConversionSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionScheduleStore implements ConversionScheduleStore {
  inner: ConversionScheduleStore;
  cache: cache.TtlCache<ConversionSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionScheduleStore,
    cacheValue: cache.TtlCache<ConversionSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionSchedule | undefined {
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

  save(item: ConversionSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionSchedule[] {
    return this.inner.list();
  }
}

export function newCachedConversionScheduleStore(inner: ConversionScheduleStore, ttl: number, clockValue: clock.Clock): ConversionScheduleStore {
  return new CachedConversionScheduleStore(inner, cache.newTtlCache<ConversionSchedule>(512, ttl, clockValue), 0, 0);
}

/** Selects conversion schedules. Empty fields match all. */
export class ConversionScheduleQuery {
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

  matches(item: ConversionSchedule): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionSchedule[]): ConversionSchedule[] {
    const matched = collections.filter(items, (candidate: ConversionSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionSchedules(store: ConversionScheduleStore, query: ConversionScheduleQuery): ConversionSchedule[] {
  return query.apply(store.list());
}

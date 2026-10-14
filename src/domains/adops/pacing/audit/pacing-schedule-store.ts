import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingSchedule } from "./pacing-schedule.js";

/** Keeps pacing schedules by code. */
export interface PacingScheduleStore {
  find(code: string): PacingSchedule | undefined;
  save(item: PacingSchedule): void;
  remove(code: string): boolean;
  list(): PacingSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingScheduleStore implements PacingScheduleStore {
  items: Map<string, PacingSchedule>;
  order: string[];

  constructor(items: Map<string, PacingSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingSchedule): void {
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

  list(): PacingSchedule[] {
    const out: PacingSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingScheduleStore(): PacingScheduleStore {
  return new MemoryPacingScheduleStore(new Map<string, PacingSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingScheduleStore implements PacingScheduleStore {
  inner: PacingScheduleStore;
  cache: cache.TtlCache<PacingSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PacingScheduleStore,
    cacheValue: cache.TtlCache<PacingSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingSchedule | undefined {
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

  save(item: PacingSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPacingScheduleStore(inner: PacingScheduleStore, ttl: number, clockValue: clock.Clock): PacingScheduleStore {
  return new CachedPacingScheduleStore(inner, cache.newTtlCache<PacingSchedule>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing schedules. Empty fields match all. */
export class PacingScheduleQuery {
  country: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minConversionRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingSchedule): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingSchedule[]): PacingSchedule[] {
    const matched = collections.filter(items, (candidate: PacingSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingSchedules(store: PacingScheduleStore, query: PacingScheduleQuery): PacingSchedule[] {
  return query.apply(store.list());
}

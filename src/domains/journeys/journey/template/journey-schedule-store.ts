import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneySchedule } from "./journey-schedule.js";

/** Keeps journey schedules by code. */
export interface JourneyScheduleStore {
  find(code: string): JourneySchedule | undefined;
  save(item: JourneySchedule): void;
  remove(code: string): boolean;
  list(): JourneySchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyScheduleStore implements JourneyScheduleStore {
  items: Map<string, JourneySchedule>;
  order: string[];

  constructor(items: Map<string, JourneySchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneySchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneySchedule): void {
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

  list(): JourneySchedule[] {
    const out: JourneySchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyScheduleStore(): JourneyScheduleStore {
  return new MemoryJourneyScheduleStore(new Map<string, JourneySchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyScheduleStore implements JourneyScheduleStore {
  inner: JourneyScheduleStore;
  cache: cache.TtlCache<JourneySchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: JourneyScheduleStore,
    cacheValue: cache.TtlCache<JourneySchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneySchedule | undefined {
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

  save(item: JourneySchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneySchedule[] {
    return this.inner.list();
  }
}

export function newCachedJourneyScheduleStore(inner: JourneyScheduleStore, ttl: number, clockValue: clock.Clock): JourneyScheduleStore {
  return new CachedJourneyScheduleStore(inner, cache.newTtlCache<JourneySchedule>(64, ttl, clockValue), 0, 0);
}

/** Selects journey schedules. Empty fields match all. */
export class JourneyScheduleQuery {
  region: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneySchedule): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneySchedule[]): JourneySchedule[] {
    const matched = collections.filter(items, (candidate: JourneySchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneySchedules(store: JourneyScheduleStore, query: JourneyScheduleQuery): JourneySchedule[] {
  return query.apply(store.list());
}

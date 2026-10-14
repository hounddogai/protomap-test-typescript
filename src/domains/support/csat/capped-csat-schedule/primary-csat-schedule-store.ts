import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryCsatSchedule } from "./primary-csat-schedule.js";

/** Keeps primary csat schedules by code. */
export interface PrimaryCsatScheduleStore {
  find(code: string): PrimaryCsatSchedule | undefined;
  save(item: PrimaryCsatSchedule): void;
  remove(code: string): boolean;
  list(): PrimaryCsatSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryCsatScheduleStore implements PrimaryCsatScheduleStore {
  items: Map<string, PrimaryCsatSchedule>;
  order: string[];

  constructor(items: Map<string, PrimaryCsatSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryCsatSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryCsatSchedule): void {
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

  list(): PrimaryCsatSchedule[] {
    const out: PrimaryCsatSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryCsatScheduleStore(): PrimaryCsatScheduleStore {
  return new MemoryPrimaryCsatScheduleStore(new Map<string, PrimaryCsatSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryCsatScheduleStore implements PrimaryCsatScheduleStore {
  inner: PrimaryCsatScheduleStore;
  cache: cache.TtlCache<PrimaryCsatSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryCsatScheduleStore,
    cacheValue: cache.TtlCache<PrimaryCsatSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryCsatSchedule | undefined {
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

  save(item: PrimaryCsatSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryCsatSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryCsatScheduleStore(inner: PrimaryCsatScheduleStore, ttl: number, clockValue: clock.Clock): PrimaryCsatScheduleStore {
  return new CachedPrimaryCsatScheduleStore(inner, cache.newTtlCache<PrimaryCsatSchedule>(64, ttl, clockValue), 0, 0);
}

/** Selects primary csat schedules. Empty fields match all. */
export class PrimaryCsatScheduleQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryCsatSchedule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryCsatSchedule[]): PrimaryCsatSchedule[] {
    const matched = collections.filter(items, (candidate: PrimaryCsatSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryCsatSchedules(store: PrimaryCsatScheduleStore, query: PrimaryCsatScheduleQuery): PrimaryCsatSchedule[] {
  return query.apply(store.list());
}

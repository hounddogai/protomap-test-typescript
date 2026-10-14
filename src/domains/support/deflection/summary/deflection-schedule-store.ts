import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionSchedule } from "./deflection-schedule.js";

/** Keeps deflection schedules by code. */
export interface DeflectionScheduleStore {
  find(code: string): DeflectionSchedule | undefined;
  save(item: DeflectionSchedule): void;
  remove(code: string): boolean;
  list(): DeflectionSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionScheduleStore implements DeflectionScheduleStore {
  items: Map<string, DeflectionSchedule>;
  order: string[];

  constructor(items: Map<string, DeflectionSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionSchedule): void {
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

  list(): DeflectionSchedule[] {
    const out: DeflectionSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionScheduleStore(): DeflectionScheduleStore {
  return new MemoryDeflectionScheduleStore(new Map<string, DeflectionSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionScheduleStore implements DeflectionScheduleStore {
  inner: DeflectionScheduleStore;
  cache: cache.TtlCache<DeflectionSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionScheduleStore,
    cacheValue: cache.TtlCache<DeflectionSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionSchedule | undefined {
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

  save(item: DeflectionSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionSchedule[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionScheduleStore(inner: DeflectionScheduleStore, ttl: number, clockValue: clock.Clock): DeflectionScheduleStore {
  return new CachedDeflectionScheduleStore(inner, cache.newTtlCache<DeflectionSchedule>(1024, ttl, clockValue), 0, 0);
}

/** Selects deflection schedules. Empty fields match all. */
export class DeflectionScheduleQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionSchedule[]): DeflectionSchedule[] {
    const matched = collections.filter(items, (candidate: DeflectionSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionSchedules(store: DeflectionScheduleStore, query: DeflectionScheduleQuery): DeflectionSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowSchedule } from "./window-schedule.js";

/** Keeps window schedules by code. */
export interface WindowScheduleStore {
  find(code: string): WindowSchedule | undefined;
  save(item: WindowSchedule): void;
  remove(code: string): boolean;
  list(): WindowSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowScheduleStore implements WindowScheduleStore {
  items: Map<string, WindowSchedule>;
  order: string[];

  constructor(items: Map<string, WindowSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowSchedule): void {
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

  list(): WindowSchedule[] {
    const out: WindowSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowScheduleStore(): WindowScheduleStore {
  return new MemoryWindowScheduleStore(new Map<string, WindowSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowScheduleStore implements WindowScheduleStore {
  inner: WindowScheduleStore;
  cache: cache.TtlCache<WindowSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowScheduleStore,
    cacheValue: cache.TtlCache<WindowSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowSchedule | undefined {
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

  save(item: WindowSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowSchedule[] {
    return this.inner.list();
  }
}

export function newCachedWindowScheduleStore(inner: WindowScheduleStore, ttl: number, clockValue: clock.Clock): WindowScheduleStore {
  return new CachedWindowScheduleStore(inner, cache.newTtlCache<WindowSchedule>(512, ttl, clockValue), 0, 0);
}

/** Selects window schedules. Empty fields match all. */
export class WindowScheduleQuery {
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

  matches(item: WindowSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowSchedule[]): WindowSchedule[] {
    const matched = collections.filter(items, (candidate: WindowSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowSchedules(store: WindowScheduleStore, query: WindowScheduleQuery): WindowSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathSchedule } from "./path-schedule.js";

/** Keeps path schedules by code. */
export interface PathScheduleStore {
  find(code: string): PathSchedule | undefined;
  save(item: PathSchedule): void;
  remove(code: string): boolean;
  list(): PathSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathScheduleStore implements PathScheduleStore {
  items: Map<string, PathSchedule>;
  order: string[];

  constructor(items: Map<string, PathSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathSchedule): void {
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

  list(): PathSchedule[] {
    const out: PathSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathScheduleStore(): PathScheduleStore {
  return new MemoryPathScheduleStore(new Map<string, PathSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathScheduleStore implements PathScheduleStore {
  inner: PathScheduleStore;
  cache: cache.TtlCache<PathSchedule>;
  hits: number;
  misses: number;

  constructor(inner: PathScheduleStore, cacheValue: cache.TtlCache<PathSchedule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathSchedule | undefined {
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

  save(item: PathSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPathScheduleStore(inner: PathScheduleStore, ttl: number, clockValue: clock.Clock): PathScheduleStore {
  return new CachedPathScheduleStore(inner, cache.newTtlCache<PathSchedule>(1024, ttl, clockValue), 0, 0);
}

/** Selects path schedules. Empty fields match all. */
export class PathScheduleQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathSchedule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathSchedule[]): PathSchedule[] {
    const matched = collections.filter(items, (candidate: PathSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathSchedules(store: PathScheduleStore, query: PathScheduleQuery): PathSchedule[] {
  return query.apply(store.list());
}

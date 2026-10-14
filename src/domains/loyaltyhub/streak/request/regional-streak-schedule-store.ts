import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalStreakSchedule } from "./regional-streak-schedule.js";

/** Keeps regional streak schedules by code. */
export interface RegionalStreakScheduleStore {
  find(code: string): RegionalStreakSchedule | undefined;
  save(item: RegionalStreakSchedule): void;
  remove(code: string): boolean;
  list(): RegionalStreakSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalStreakScheduleStore implements RegionalStreakScheduleStore {
  items: Map<string, RegionalStreakSchedule>;
  order: string[];

  constructor(items: Map<string, RegionalStreakSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalStreakSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalStreakSchedule): void {
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

  list(): RegionalStreakSchedule[] {
    const out: RegionalStreakSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalStreakScheduleStore(): RegionalStreakScheduleStore {
  return new MemoryRegionalStreakScheduleStore(new Map<string, RegionalStreakSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalStreakScheduleStore implements RegionalStreakScheduleStore {
  inner: RegionalStreakScheduleStore;
  cache: cache.TtlCache<RegionalStreakSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalStreakScheduleStore,
    cacheValue: cache.TtlCache<RegionalStreakSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalStreakSchedule | undefined {
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

  save(item: RegionalStreakSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalStreakSchedule[] {
    return this.inner.list();
  }
}

export function newCachedRegionalStreakScheduleStore(inner: RegionalStreakScheduleStore, ttl: number, clockValue: clock.Clock): RegionalStreakScheduleStore {
  return new CachedRegionalStreakScheduleStore(
    inner,
    cache.newTtlCache<RegionalStreakSchedule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional streak schedules. Empty fields match all. */
export class RegionalStreakScheduleQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalStreakSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalStreakSchedule[]): RegionalStreakSchedule[] {
    const matched = collections.filter(items, (candidate: RegionalStreakSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalStreakSchedules(store: RegionalStreakScheduleStore, query: RegionalStreakScheduleQuery): RegionalStreakSchedule[] {
  return query.apply(store.list());
}

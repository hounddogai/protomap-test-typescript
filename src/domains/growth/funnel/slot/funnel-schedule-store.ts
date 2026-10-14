import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelSchedule } from "./funnel-schedule.js";

/** Keeps funnel schedules by code. */
export interface FunnelScheduleStore {
  find(code: string): FunnelSchedule | undefined;
  save(item: FunnelSchedule): void;
  remove(code: string): boolean;
  list(): FunnelSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelScheduleStore implements FunnelScheduleStore {
  items: Map<string, FunnelSchedule>;
  order: string[];

  constructor(items: Map<string, FunnelSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelSchedule): void {
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

  list(): FunnelSchedule[] {
    const out: FunnelSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelScheduleStore(): FunnelScheduleStore {
  return new MemoryFunnelScheduleStore(new Map<string, FunnelSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelScheduleStore implements FunnelScheduleStore {
  inner: FunnelScheduleStore;
  cache: cache.TtlCache<FunnelSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelScheduleStore,
    cacheValue: cache.TtlCache<FunnelSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelSchedule | undefined {
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

  save(item: FunnelSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelSchedule[] {
    return this.inner.list();
  }
}

export function newCachedFunnelScheduleStore(inner: FunnelScheduleStore, ttl: number, clockValue: clock.Clock): FunnelScheduleStore {
  return new CachedFunnelScheduleStore(inner, cache.newTtlCache<FunnelSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects funnel schedules. Empty fields match all. */
export class FunnelScheduleQuery {
  utmSource: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minGraceDays: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelSchedule): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelSchedule[]): FunnelSchedule[] {
    const matched = collections.filter(items, (candidate: FunnelSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelSchedules(store: FunnelScheduleStore, query: FunnelScheduleQuery): FunnelSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientInsightSchedule } from "./lenient-insight-schedule.js";

/** Keeps lenient insight schedules by code. */
export interface LenientInsightScheduleStore {
  find(code: string): LenientInsightSchedule | undefined;
  save(item: LenientInsightSchedule): void;
  remove(code: string): boolean;
  list(): LenientInsightSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientInsightScheduleStore implements LenientInsightScheduleStore {
  items: Map<string, LenientInsightSchedule>;
  order: string[];

  constructor(items: Map<string, LenientInsightSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientInsightSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientInsightSchedule): void {
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

  list(): LenientInsightSchedule[] {
    const out: LenientInsightSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientInsightScheduleStore(): LenientInsightScheduleStore {
  return new MemoryLenientInsightScheduleStore(new Map<string, LenientInsightSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientInsightScheduleStore implements LenientInsightScheduleStore {
  inner: LenientInsightScheduleStore;
  cache: cache.TtlCache<LenientInsightSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientInsightScheduleStore,
    cacheValue: cache.TtlCache<LenientInsightSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientInsightSchedule | undefined {
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

  save(item: LenientInsightSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientInsightSchedule[] {
    return this.inner.list();
  }
}

export function newCachedLenientInsightScheduleStore(inner: LenientInsightScheduleStore, ttl: number, clockValue: clock.Clock): LenientInsightScheduleStore {
  return new CachedLenientInsightScheduleStore(
    inner,
    cache.newTtlCache<LenientInsightSchedule>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient insight schedules. Empty fields match all. */
export class LenientInsightScheduleQuery {
  country: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMargin: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientInsightSchedule): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientInsightSchedule[]): LenientInsightSchedule[] {
    const matched = collections.filter(items, (candidate: LenientInsightSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientInsightSchedules(store: LenientInsightScheduleStore, query: LenientInsightScheduleQuery): LenientInsightSchedule[] {
  return query.apply(store.list());
}

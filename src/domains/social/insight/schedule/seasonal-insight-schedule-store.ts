import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

/** Keeps seasonal insight schedules by code. */
export interface SeasonalInsightScheduleStore {
  find(code: string): SeasonalInsightSchedule | undefined;
  save(item: SeasonalInsightSchedule): void;
  remove(code: string): boolean;
  list(): SeasonalInsightSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalInsightScheduleStore implements SeasonalInsightScheduleStore {
  items: Map<string, SeasonalInsightSchedule>;
  order: string[];

  constructor(items: Map<string, SeasonalInsightSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalInsightSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalInsightSchedule): void {
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

  list(): SeasonalInsightSchedule[] {
    const out: SeasonalInsightSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalInsightScheduleStore(): SeasonalInsightScheduleStore {
  return new MemorySeasonalInsightScheduleStore(new Map<string, SeasonalInsightSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalInsightScheduleStore implements SeasonalInsightScheduleStore {
  inner: SeasonalInsightScheduleStore;
  cache: cache.TtlCache<SeasonalInsightSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalInsightScheduleStore,
    cacheValue: cache.TtlCache<SeasonalInsightSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalInsightSchedule | undefined {
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

  save(item: SeasonalInsightSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalInsightSchedule[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalInsightScheduleStore(inner: SeasonalInsightScheduleStore, ttl: number, clockValue: clock.Clock): SeasonalInsightScheduleStore {
  return new CachedSeasonalInsightScheduleStore(
    inner,
    cache.newTtlCache<SeasonalInsightSchedule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal insight schedules. Empty fields match all. */
export class SeasonalInsightScheduleQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalInsightSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalInsightSchedule[]): SeasonalInsightSchedule[] {
    const matched = collections.filter(items, (candidate: SeasonalInsightSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalInsightSchedules(store: SeasonalInsightScheduleStore, query: SeasonalInsightScheduleQuery): SeasonalInsightSchedule[] {
  return query.apply(store.list());
}

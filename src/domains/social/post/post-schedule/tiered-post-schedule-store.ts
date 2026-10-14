import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPostSchedule } from "./tiered-post-schedule.js";

/** Keeps tiered post schedules by code. */
export interface TieredPostScheduleStore {
  find(code: string): TieredPostSchedule | undefined;
  save(item: TieredPostSchedule): void;
  remove(code: string): boolean;
  list(): TieredPostSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPostScheduleStore implements TieredPostScheduleStore {
  items: Map<string, TieredPostSchedule>;
  order: string[];

  constructor(items: Map<string, TieredPostSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPostSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPostSchedule): void {
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

  list(): TieredPostSchedule[] {
    const out: TieredPostSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPostScheduleStore(): TieredPostScheduleStore {
  return new MemoryTieredPostScheduleStore(new Map<string, TieredPostSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPostScheduleStore implements TieredPostScheduleStore {
  inner: TieredPostScheduleStore;
  cache: cache.TtlCache<TieredPostSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPostScheduleStore,
    cacheValue: cache.TtlCache<TieredPostSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPostSchedule | undefined {
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

  save(item: TieredPostSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPostSchedule[] {
    return this.inner.list();
  }
}

export function newCachedTieredPostScheduleStore(inner: TieredPostScheduleStore, ttl: number, clockValue: clock.Clock): TieredPostScheduleStore {
  return new CachedTieredPostScheduleStore(inner, cache.newTtlCache<TieredPostSchedule>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered post schedules. Empty fields match all. */
export class TieredPostScheduleQuery {
  source: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMargin: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPostSchedule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPostSchedule[]): TieredPostSchedule[] {
    const matched = collections.filter(items, (candidate: TieredPostSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPostSchedules(store: TieredPostScheduleStore, query: TieredPostScheduleQuery): TieredPostSchedule[] {
  return query.apply(store.list());
}

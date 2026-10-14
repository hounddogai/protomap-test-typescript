import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupSchedule } from "./warmup-schedule.js";

/** Keeps warmup schedules by code. */
export interface WarmupScheduleStore {
  find(code: string): WarmupSchedule | undefined;
  save(item: WarmupSchedule): void;
  remove(code: string): boolean;
  list(): WarmupSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupScheduleStore implements WarmupScheduleStore {
  items: Map<string, WarmupSchedule>;
  order: string[];

  constructor(items: Map<string, WarmupSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupSchedule): void {
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

  list(): WarmupSchedule[] {
    const out: WarmupSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupScheduleStore(): WarmupScheduleStore {
  return new MemoryWarmupScheduleStore(new Map<string, WarmupSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupScheduleStore implements WarmupScheduleStore {
  inner: WarmupScheduleStore;
  cache: cache.TtlCache<WarmupSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupScheduleStore,
    cacheValue: cache.TtlCache<WarmupSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupSchedule | undefined {
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

  save(item: WarmupSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupSchedule[] {
    return this.inner.list();
  }
}

export function newCachedWarmupScheduleStore(inner: WarmupScheduleStore, ttl: number, clockValue: clock.Clock): WarmupScheduleStore {
  return new CachedWarmupScheduleStore(inner, cache.newTtlCache<WarmupSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects warmup schedules. Empty fields match all. */
export class WarmupScheduleQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupSchedule[]): WarmupSchedule[] {
    const matched = collections.filter(items, (candidate: WarmupSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupSchedules(store: WarmupScheduleStore, query: WarmupScheduleQuery): WarmupSchedule[] {
  return query.apply(store.list());
}

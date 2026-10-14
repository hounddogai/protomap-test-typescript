import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackWaitSchedule } from "./fallback-wait-schedule.js";

/** Keeps fallback wait schedules by code. */
export interface FallbackWaitScheduleStore {
  find(code: string): FallbackWaitSchedule | undefined;
  save(item: FallbackWaitSchedule): void;
  remove(code: string): boolean;
  list(): FallbackWaitSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackWaitScheduleStore implements FallbackWaitScheduleStore {
  items: Map<string, FallbackWaitSchedule>;
  order: string[];

  constructor(items: Map<string, FallbackWaitSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackWaitSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackWaitSchedule): void {
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

  list(): FallbackWaitSchedule[] {
    const out: FallbackWaitSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackWaitScheduleStore(): FallbackWaitScheduleStore {
  return new MemoryFallbackWaitScheduleStore(new Map<string, FallbackWaitSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackWaitScheduleStore implements FallbackWaitScheduleStore {
  inner: FallbackWaitScheduleStore;
  cache: cache.TtlCache<FallbackWaitSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackWaitScheduleStore,
    cacheValue: cache.TtlCache<FallbackWaitSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackWaitSchedule | undefined {
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

  save(item: FallbackWaitSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackWaitSchedule[] {
    return this.inner.list();
  }
}

export function newCachedFallbackWaitScheduleStore(inner: FallbackWaitScheduleStore, ttl: number, clockValue: clock.Clock): FallbackWaitScheduleStore {
  return new CachedFallbackWaitScheduleStore(
    inner,
    cache.newTtlCache<FallbackWaitSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback wait schedules. Empty fields match all. */
export class FallbackWaitScheduleQuery {
  channel: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minVersion: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackWaitSchedule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackWaitSchedule[]): FallbackWaitSchedule[] {
    const matched = collections.filter(items, (candidate: FallbackWaitSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackWaitSchedules(store: FallbackWaitScheduleStore, query: FallbackWaitScheduleQuery): FallbackWaitSchedule[] {
  return query.apply(store.list());
}

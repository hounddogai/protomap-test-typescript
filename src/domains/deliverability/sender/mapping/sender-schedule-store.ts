import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderSchedule } from "./sender-schedule.js";

/** Keeps sender schedules by code. */
export interface SenderScheduleStore {
  find(code: string): SenderSchedule | undefined;
  save(item: SenderSchedule): void;
  remove(code: string): boolean;
  list(): SenderSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderScheduleStore implements SenderScheduleStore {
  items: Map<string, SenderSchedule>;
  order: string[];

  constructor(items: Map<string, SenderSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderSchedule): void {
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

  list(): SenderSchedule[] {
    const out: SenderSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderScheduleStore(): SenderScheduleStore {
  return new MemorySenderScheduleStore(new Map<string, SenderSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderScheduleStore implements SenderScheduleStore {
  inner: SenderScheduleStore;
  cache: cache.TtlCache<SenderSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: SenderScheduleStore,
    cacheValue: cache.TtlCache<SenderSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderSchedule | undefined {
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

  save(item: SenderSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderSchedule[] {
    return this.inner.list();
  }
}

export function newCachedSenderScheduleStore(inner: SenderScheduleStore, ttl: number, clockValue: clock.Clock): SenderScheduleStore {
  return new CachedSenderScheduleStore(inner, cache.newTtlCache<SenderSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects sender schedules. Empty fields match all. */
export class SenderScheduleQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderSchedule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderSchedule[]): SenderSchedule[] {
    const matched = collections.filter(items, (candidate: SenderSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderSchedules(store: SenderScheduleStore, query: SenderScheduleQuery): SenderSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueSchedule } from "./queue-schedule.js";

/** Keeps queue schedules by code. */
export interface QueueScheduleStore {
  find(code: string): QueueSchedule | undefined;
  save(item: QueueSchedule): void;
  remove(code: string): boolean;
  list(): QueueSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueScheduleStore implements QueueScheduleStore {
  items: Map<string, QueueSchedule>;
  order: string[];

  constructor(items: Map<string, QueueSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueSchedule): void {
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

  list(): QueueSchedule[] {
    const out: QueueSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueScheduleStore(): QueueScheduleStore {
  return new MemoryQueueScheduleStore(new Map<string, QueueSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueScheduleStore implements QueueScheduleStore {
  inner: QueueScheduleStore;
  cache: cache.TtlCache<QueueSchedule>;
  hits: number;
  misses: number;

  constructor(inner: QueueScheduleStore, cacheValue: cache.TtlCache<QueueSchedule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueSchedule | undefined {
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

  save(item: QueueSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueSchedule[] {
    return this.inner.list();
  }
}

export function newCachedQueueScheduleStore(inner: QueueScheduleStore, ttl: number, clockValue: clock.Clock): QueueScheduleStore {
  return new CachedQueueScheduleStore(inner, cache.newTtlCache<QueueSchedule>(64, ttl, clockValue), 0, 0);
}

/** Selects queue schedules. Empty fields match all. */
export class QueueScheduleQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueSchedule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueSchedule[]): QueueSchedule[] {
    const matched = collections.filter(items, (candidate: QueueSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueSchedules(store: QueueScheduleStore, query: QueueScheduleQuery): QueueSchedule[] {
  return query.apply(store.list());
}

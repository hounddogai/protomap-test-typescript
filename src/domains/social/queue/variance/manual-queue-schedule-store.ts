import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualQueueSchedule } from "./manual-queue-schedule.js";

/** Keeps manual queue schedules by code. */
export interface ManualQueueScheduleStore {
  find(code: string): ManualQueueSchedule | undefined;
  save(item: ManualQueueSchedule): void;
  remove(code: string): boolean;
  list(): ManualQueueSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualQueueScheduleStore implements ManualQueueScheduleStore {
  items: Map<string, ManualQueueSchedule>;
  order: string[];

  constructor(items: Map<string, ManualQueueSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualQueueSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualQueueSchedule): void {
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

  list(): ManualQueueSchedule[] {
    const out: ManualQueueSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualQueueScheduleStore(): ManualQueueScheduleStore {
  return new MemoryManualQueueScheduleStore(new Map<string, ManualQueueSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualQueueScheduleStore implements ManualQueueScheduleStore {
  inner: ManualQueueScheduleStore;
  cache: cache.TtlCache<ManualQueueSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualQueueScheduleStore,
    cacheValue: cache.TtlCache<ManualQueueSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualQueueSchedule | undefined {
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

  save(item: ManualQueueSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualQueueSchedule[] {
    return this.inner.list();
  }
}

export function newCachedManualQueueScheduleStore(inner: ManualQueueScheduleStore, ttl: number, clockValue: clock.Clock): ManualQueueScheduleStore {
  return new CachedManualQueueScheduleStore(inner, cache.newTtlCache<ManualQueueSchedule>(128, ttl, clockValue), 0, 0);
}

/** Selects manual queue schedules. Empty fields match all. */
export class ManualQueueScheduleQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualQueueSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualQueueSchedule[]): ManualQueueSchedule[] {
    const matched = collections.filter(items, (candidate: ManualQueueSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualQueueSchedules(store: ManualQueueScheduleStore, query: ManualQueueScheduleQuery): ManualQueueSchedule[] {
  return query.apply(store.list());
}

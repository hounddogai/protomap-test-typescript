import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingCohortSchedule } from "./pending-cohort-schedule.js";

/** Keeps pending cohort schedules by code. */
export interface PendingCohortScheduleStore {
  find(code: string): PendingCohortSchedule | undefined;
  save(item: PendingCohortSchedule): void;
  remove(code: string): boolean;
  list(): PendingCohortSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingCohortScheduleStore implements PendingCohortScheduleStore {
  items: Map<string, PendingCohortSchedule>;
  order: string[];

  constructor(items: Map<string, PendingCohortSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingCohortSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingCohortSchedule): void {
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

  list(): PendingCohortSchedule[] {
    const out: PendingCohortSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingCohortScheduleStore(): PendingCohortScheduleStore {
  return new MemoryPendingCohortScheduleStore(new Map<string, PendingCohortSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingCohortScheduleStore implements PendingCohortScheduleStore {
  inner: PendingCohortScheduleStore;
  cache: cache.TtlCache<PendingCohortSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingCohortScheduleStore,
    cacheValue: cache.TtlCache<PendingCohortSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingCohortSchedule | undefined {
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

  save(item: PendingCohortSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingCohortSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPendingCohortScheduleStore(inner: PendingCohortScheduleStore, ttl: number, clockValue: clock.Clock): PendingCohortScheduleStore {
  return new CachedPendingCohortScheduleStore(
    inner,
    cache.newTtlCache<PendingCohortSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending cohort schedules. Empty fields match all. */
export class PendingCohortScheduleQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingCohortSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingCohortSchedule[]): PendingCohortSchedule[] {
    const matched = collections.filter(items, (candidate: PendingCohortSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingCohortSchedules(store: PendingCohortScheduleStore, query: PendingCohortScheduleQuery): PendingCohortSchedule[] {
  return query.apply(store.list());
}

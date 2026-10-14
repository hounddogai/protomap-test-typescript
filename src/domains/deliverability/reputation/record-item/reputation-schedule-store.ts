import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationSchedule } from "./reputation-schedule.js";

/** Keeps reputation schedules by code. */
export interface ReputationScheduleStore {
  find(code: string): ReputationSchedule | undefined;
  save(item: ReputationSchedule): void;
  remove(code: string): boolean;
  list(): ReputationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationScheduleStore implements ReputationScheduleStore {
  items: Map<string, ReputationSchedule>;
  order: string[];

  constructor(items: Map<string, ReputationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationSchedule): void {
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

  list(): ReputationSchedule[] {
    const out: ReputationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationScheduleStore(): ReputationScheduleStore {
  return new MemoryReputationScheduleStore(new Map<string, ReputationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationScheduleStore implements ReputationScheduleStore {
  inner: ReputationScheduleStore;
  cache: cache.TtlCache<ReputationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationScheduleStore,
    cacheValue: cache.TtlCache<ReputationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationSchedule | undefined {
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

  save(item: ReputationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedReputationScheduleStore(inner: ReputationScheduleStore, ttl: number, clockValue: clock.Clock): ReputationScheduleStore {
  return new CachedReputationScheduleStore(inner, cache.newTtlCache<ReputationSchedule>(512, ttl, clockValue), 0, 0);
}

/** Selects reputation schedules. Empty fields match all. */
export class ReputationScheduleQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationSchedule[]): ReputationSchedule[] {
    const matched = collections.filter(items, (candidate: ReputationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationSchedules(store: ReputationScheduleStore, query: ReputationScheduleQuery): ReputationSchedule[] {
  return query.apply(store.list());
}

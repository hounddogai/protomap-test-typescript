import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardSchedule } from "./reward-schedule.js";

/** Keeps reward schedules by code. */
export interface RewardScheduleStore {
  find(code: string): RewardSchedule | undefined;
  save(item: RewardSchedule): void;
  remove(code: string): boolean;
  list(): RewardSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardScheduleStore implements RewardScheduleStore {
  items: Map<string, RewardSchedule>;
  order: string[];

  constructor(items: Map<string, RewardSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardSchedule): void {
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

  list(): RewardSchedule[] {
    const out: RewardSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardScheduleStore(): RewardScheduleStore {
  return new MemoryRewardScheduleStore(new Map<string, RewardSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardScheduleStore implements RewardScheduleStore {
  inner: RewardScheduleStore;
  cache: cache.TtlCache<RewardSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardScheduleStore,
    cacheValue: cache.TtlCache<RewardSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardSchedule | undefined {
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

  save(item: RewardSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardSchedule[] {
    return this.inner.list();
  }
}

export function newCachedRewardScheduleStore(inner: RewardScheduleStore, ttl: number, clockValue: clock.Clock): RewardScheduleStore {
  return new CachedRewardScheduleStore(inner, cache.newTtlCache<RewardSchedule>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward schedules. Empty fields match all. */
export class RewardScheduleQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardSchedule[]): RewardSchedule[] {
    const matched = collections.filter(items, (candidate: RewardSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardSchedules(store: RewardScheduleStore, query: RewardScheduleQuery): RewardSchedule[] {
  return query.apply(store.list());
}

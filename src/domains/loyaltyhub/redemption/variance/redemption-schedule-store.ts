import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionSchedule } from "./redemption-schedule.js";

/** Keeps redemption schedules by code. */
export interface RedemptionScheduleStore {
  find(code: string): RedemptionSchedule | undefined;
  save(item: RedemptionSchedule): void;
  remove(code: string): boolean;
  list(): RedemptionSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionScheduleStore implements RedemptionScheduleStore {
  items: Map<string, RedemptionSchedule>;
  order: string[];

  constructor(items: Map<string, RedemptionSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionSchedule): void {
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

  list(): RedemptionSchedule[] {
    const out: RedemptionSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionScheduleStore(): RedemptionScheduleStore {
  return new MemoryRedemptionScheduleStore(new Map<string, RedemptionSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionScheduleStore implements RedemptionScheduleStore {
  inner: RedemptionScheduleStore;
  cache: cache.TtlCache<RedemptionSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionScheduleStore,
    cacheValue: cache.TtlCache<RedemptionSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionSchedule | undefined {
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

  save(item: RedemptionSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionSchedule[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionScheduleStore(inner: RedemptionScheduleStore, ttl: number, clockValue: clock.Clock): RedemptionScheduleStore {
  return new CachedRedemptionScheduleStore(inner, cache.newTtlCache<RedemptionSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects redemption schedules. Empty fields match all. */
export class RedemptionScheduleQuery {
  category: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionSchedule): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionSchedule[]): RedemptionSchedule[] {
    const matched = collections.filter(items, (candidate: RedemptionSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionSchedules(store: RedemptionScheduleStore, query: RedemptionScheduleQuery): RedemptionSchedule[] {
  return query.apply(store.list());
}

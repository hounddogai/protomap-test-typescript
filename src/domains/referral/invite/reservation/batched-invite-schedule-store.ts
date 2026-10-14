import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedInviteSchedule } from "./batched-invite-schedule.js";

/** Keeps batched invite schedules by code. */
export interface BatchedInviteScheduleStore {
  find(code: string): BatchedInviteSchedule | undefined;
  save(item: BatchedInviteSchedule): void;
  remove(code: string): boolean;
  list(): BatchedInviteSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedInviteScheduleStore implements BatchedInviteScheduleStore {
  items: Map<string, BatchedInviteSchedule>;
  order: string[];

  constructor(items: Map<string, BatchedInviteSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedInviteSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedInviteSchedule): void {
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

  list(): BatchedInviteSchedule[] {
    const out: BatchedInviteSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedInviteScheduleStore(): BatchedInviteScheduleStore {
  return new MemoryBatchedInviteScheduleStore(new Map<string, BatchedInviteSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedInviteScheduleStore implements BatchedInviteScheduleStore {
  inner: BatchedInviteScheduleStore;
  cache: cache.TtlCache<BatchedInviteSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedInviteScheduleStore,
    cacheValue: cache.TtlCache<BatchedInviteSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedInviteSchedule | undefined {
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

  save(item: BatchedInviteSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedInviteSchedule[] {
    return this.inner.list();
  }
}

export function newCachedBatchedInviteScheduleStore(inner: BatchedInviteScheduleStore, ttl: number, clockValue: clock.Clock): BatchedInviteScheduleStore {
  return new CachedBatchedInviteScheduleStore(
    inner,
    cache.newTtlCache<BatchedInviteSchedule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched invite schedules. Empty fields match all. */
export class BatchedInviteScheduleQuery {
  utmSource: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDiscount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedInviteSchedule): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedInviteSchedule[]): BatchedInviteSchedule[] {
    const matched = collections.filter(items, (candidate: BatchedInviteSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedInviteSchedules(store: BatchedInviteScheduleStore, query: BatchedInviteScheduleQuery): BatchedInviteSchedule[] {
  return query.apply(store.list());
}

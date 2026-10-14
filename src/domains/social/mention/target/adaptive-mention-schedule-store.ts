import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveMentionSchedule } from "./adaptive-mention-schedule.js";

/** Keeps adaptive mention schedules by code. */
export interface AdaptiveMentionScheduleStore {
  find(code: string): AdaptiveMentionSchedule | undefined;
  save(item: AdaptiveMentionSchedule): void;
  remove(code: string): boolean;
  list(): AdaptiveMentionSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveMentionScheduleStore implements AdaptiveMentionScheduleStore {
  items: Map<string, AdaptiveMentionSchedule>;
  order: string[];

  constructor(items: Map<string, AdaptiveMentionSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveMentionSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveMentionSchedule): void {
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

  list(): AdaptiveMentionSchedule[] {
    const out: AdaptiveMentionSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveMentionScheduleStore(): AdaptiveMentionScheduleStore {
  return new MemoryAdaptiveMentionScheduleStore(new Map<string, AdaptiveMentionSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveMentionScheduleStore implements AdaptiveMentionScheduleStore {
  inner: AdaptiveMentionScheduleStore;
  cache: cache.TtlCache<AdaptiveMentionSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveMentionScheduleStore,
    cacheValue: cache.TtlCache<AdaptiveMentionSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveMentionSchedule | undefined {
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

  save(item: AdaptiveMentionSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveMentionSchedule[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveMentionScheduleStore(inner: AdaptiveMentionScheduleStore, ttl: number, clockValue: clock.Clock): AdaptiveMentionScheduleStore {
  return new CachedAdaptiveMentionScheduleStore(
    inner,
    cache.newTtlCache<AdaptiveMentionSchedule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive mention schedules. Empty fields match all. */
export class AdaptiveMentionScheduleQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveMentionSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveMentionSchedule[]): AdaptiveMentionSchedule[] {
    const matched = collections.filter(items, (candidate: AdaptiveMentionSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveMentionSchedules(store: AdaptiveMentionScheduleStore, query: AdaptiveMentionScheduleQuery): AdaptiveMentionSchedule[] {
  return query.apply(store.list());
}

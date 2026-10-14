import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedDeflectionSchedule } from "./weighted-deflection-schedule.js";

/** Keeps weighted deflection schedules by code. */
export interface WeightedDeflectionScheduleStore {
  find(code: string): WeightedDeflectionSchedule | undefined;
  save(item: WeightedDeflectionSchedule): void;
  remove(code: string): boolean;
  list(): WeightedDeflectionSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedDeflectionScheduleStore implements WeightedDeflectionScheduleStore {
  items: Map<string, WeightedDeflectionSchedule>;
  order: string[];

  constructor(items: Map<string, WeightedDeflectionSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedDeflectionSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedDeflectionSchedule): void {
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

  list(): WeightedDeflectionSchedule[] {
    const out: WeightedDeflectionSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedDeflectionScheduleStore(): WeightedDeflectionScheduleStore {
  return new MemoryWeightedDeflectionScheduleStore(new Map<string, WeightedDeflectionSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedDeflectionScheduleStore implements WeightedDeflectionScheduleStore {
  inner: WeightedDeflectionScheduleStore;
  cache: cache.TtlCache<WeightedDeflectionSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedDeflectionScheduleStore,
    cacheValue: cache.TtlCache<WeightedDeflectionSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedDeflectionSchedule | undefined {
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

  save(item: WeightedDeflectionSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedDeflectionSchedule[] {
    return this.inner.list();
  }
}

export function newCachedWeightedDeflectionScheduleStore(inner: WeightedDeflectionScheduleStore, ttl: number, clockValue: clock.Clock): WeightedDeflectionScheduleStore {
  return new CachedWeightedDeflectionScheduleStore(
    inner,
    cache.newTtlCache<WeightedDeflectionSchedule>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted deflection schedules. Empty fields match all. */
export class WeightedDeflectionScheduleQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedDeflectionSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedDeflectionSchedule[]): WeightedDeflectionSchedule[] {
    const matched = collections.filter(items, (candidate: WeightedDeflectionSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedDeflectionSchedules(store: WeightedDeflectionScheduleStore, query: WeightedDeflectionScheduleQuery): WeightedDeflectionSchedule[] {
  return query.apply(store.list());
}

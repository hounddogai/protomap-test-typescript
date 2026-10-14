import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedStepSchedule } from "./weighted-step-schedule.js";

/** Keeps weighted step schedules by code. */
export interface WeightedStepScheduleStore {
  find(code: string): WeightedStepSchedule | undefined;
  save(item: WeightedStepSchedule): void;
  remove(code: string): boolean;
  list(): WeightedStepSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedStepScheduleStore implements WeightedStepScheduleStore {
  items: Map<string, WeightedStepSchedule>;
  order: string[];

  constructor(items: Map<string, WeightedStepSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedStepSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedStepSchedule): void {
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

  list(): WeightedStepSchedule[] {
    const out: WeightedStepSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedStepScheduleStore(): WeightedStepScheduleStore {
  return new MemoryWeightedStepScheduleStore(new Map<string, WeightedStepSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedStepScheduleStore implements WeightedStepScheduleStore {
  inner: WeightedStepScheduleStore;
  cache: cache.TtlCache<WeightedStepSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedStepScheduleStore,
    cacheValue: cache.TtlCache<WeightedStepSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedStepSchedule | undefined {
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

  save(item: WeightedStepSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedStepSchedule[] {
    return this.inner.list();
  }
}

export function newCachedWeightedStepScheduleStore(inner: WeightedStepScheduleStore, ttl: number, clockValue: clock.Clock): WeightedStepScheduleStore {
  return new CachedWeightedStepScheduleStore(
    inner,
    cache.newTtlCache<WeightedStepSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted step schedules. Empty fields match all. */
export class WeightedStepScheduleQuery {
  source: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRevision: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedStepSchedule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedStepSchedule[]): WeightedStepSchedule[] {
    const matched = collections.filter(items, (candidate: WeightedStepSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedStepSchedules(store: WeightedStepScheduleStore, query: WeightedStepScheduleQuery): WeightedStepSchedule[] {
  return query.apply(store.list());
}

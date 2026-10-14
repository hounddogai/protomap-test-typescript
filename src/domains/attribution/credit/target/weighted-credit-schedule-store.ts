import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedCreditSchedule } from "./weighted-credit-schedule.js";

/** Keeps weighted credit schedules by code. */
export interface WeightedCreditScheduleStore {
  find(code: string): WeightedCreditSchedule | undefined;
  save(item: WeightedCreditSchedule): void;
  remove(code: string): boolean;
  list(): WeightedCreditSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedCreditScheduleStore implements WeightedCreditScheduleStore {
  items: Map<string, WeightedCreditSchedule>;
  order: string[];

  constructor(items: Map<string, WeightedCreditSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedCreditSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedCreditSchedule): void {
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

  list(): WeightedCreditSchedule[] {
    const out: WeightedCreditSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedCreditScheduleStore(): WeightedCreditScheduleStore {
  return new MemoryWeightedCreditScheduleStore(new Map<string, WeightedCreditSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedCreditScheduleStore implements WeightedCreditScheduleStore {
  inner: WeightedCreditScheduleStore;
  cache: cache.TtlCache<WeightedCreditSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedCreditScheduleStore,
    cacheValue: cache.TtlCache<WeightedCreditSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedCreditSchedule | undefined {
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

  save(item: WeightedCreditSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedCreditSchedule[] {
    return this.inner.list();
  }
}

export function newCachedWeightedCreditScheduleStore(inner: WeightedCreditScheduleStore, ttl: number, clockValue: clock.Clock): WeightedCreditScheduleStore {
  return new CachedWeightedCreditScheduleStore(
    inner,
    cache.newTtlCache<WeightedCreditSchedule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted credit schedules. Empty fields match all. */
export class WeightedCreditScheduleQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedCreditSchedule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedCreditSchedule[]): WeightedCreditSchedule[] {
    const matched = collections.filter(items, (candidate: WeightedCreditSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedCreditSchedules(store: WeightedCreditScheduleStore, query: WeightedCreditScheduleQuery): WeightedCreditSchedule[] {
  return query.apply(store.list());
}

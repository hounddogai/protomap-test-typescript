import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckSchedule } from "./fraud-check-schedule.js";

/** Keeps fraud check schedules by code. */
export interface FraudCheckScheduleStore {
  find(code: string): FraudCheckSchedule | undefined;
  save(item: FraudCheckSchedule): void;
  remove(code: string): boolean;
  list(): FraudCheckSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckScheduleStore implements FraudCheckScheduleStore {
  items: Map<string, FraudCheckSchedule>;
  order: string[];

  constructor(items: Map<string, FraudCheckSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckSchedule): void {
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

  list(): FraudCheckSchedule[] {
    const out: FraudCheckSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckScheduleStore(): FraudCheckScheduleStore {
  return new MemoryFraudCheckScheduleStore(new Map<string, FraudCheckSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckScheduleStore implements FraudCheckScheduleStore {
  inner: FraudCheckScheduleStore;
  cache: cache.TtlCache<FraudCheckSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckScheduleStore,
    cacheValue: cache.TtlCache<FraudCheckSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckSchedule | undefined {
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

  save(item: FraudCheckSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckSchedule[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckScheduleStore(inner: FraudCheckScheduleStore, ttl: number, clockValue: clock.Clock): FraudCheckScheduleStore {
  return new CachedFraudCheckScheduleStore(inner, cache.newTtlCache<FraudCheckSchedule>(512, ttl, clockValue), 0, 0);
}

/** Selects fraud check schedules. Empty fields match all. */
export class FraudCheckScheduleQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckSchedule[]): FraudCheckSchedule[] {
    const matched = collections.filter(items, (candidate: FraudCheckSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckSchedules(store: FraudCheckScheduleStore, query: FraudCheckScheduleQuery): FraudCheckSchedule[] {
  return query.apply(store.list());
}

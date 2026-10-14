import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualActivationSchedule } from "./manual-activation-schedule.js";

/** Keeps manual activation schedules by code. */
export interface ManualActivationScheduleStore {
  find(code: string): ManualActivationSchedule | undefined;
  save(item: ManualActivationSchedule): void;
  remove(code: string): boolean;
  list(): ManualActivationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualActivationScheduleStore implements ManualActivationScheduleStore {
  items: Map<string, ManualActivationSchedule>;
  order: string[];

  constructor(items: Map<string, ManualActivationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualActivationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualActivationSchedule): void {
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

  list(): ManualActivationSchedule[] {
    const out: ManualActivationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualActivationScheduleStore(): ManualActivationScheduleStore {
  return new MemoryManualActivationScheduleStore(new Map<string, ManualActivationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualActivationScheduleStore implements ManualActivationScheduleStore {
  inner: ManualActivationScheduleStore;
  cache: cache.TtlCache<ManualActivationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualActivationScheduleStore,
    cacheValue: cache.TtlCache<ManualActivationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualActivationSchedule | undefined {
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

  save(item: ManualActivationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualActivationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedManualActivationScheduleStore(inner: ManualActivationScheduleStore, ttl: number, clockValue: clock.Clock): ManualActivationScheduleStore {
  return new CachedManualActivationScheduleStore(
    inner,
    cache.newTtlCache<ManualActivationSchedule>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual activation schedules. Empty fields match all. */
export class ManualActivationScheduleQuery {
  segment: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minImpressions: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualActivationSchedule): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualActivationSchedule[]): ManualActivationSchedule[] {
    const matched = collections.filter(items, (candidate: ManualActivationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualActivationSchedules(store: ManualActivationScheduleStore, query: ManualActivationScheduleQuery): ManualActivationSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutSchedule } from "./opt-out-schedule.js";

/** Keeps opt out schedules by code. */
export interface OptOutScheduleStore {
  find(code: string): OptOutSchedule | undefined;
  save(item: OptOutSchedule): void;
  remove(code: string): boolean;
  list(): OptOutSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutScheduleStore implements OptOutScheduleStore {
  items: Map<string, OptOutSchedule>;
  order: string[];

  constructor(items: Map<string, OptOutSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutSchedule): void {
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

  list(): OptOutSchedule[] {
    const out: OptOutSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutScheduleStore(): OptOutScheduleStore {
  return new MemoryOptOutScheduleStore(new Map<string, OptOutSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutScheduleStore implements OptOutScheduleStore {
  inner: OptOutScheduleStore;
  cache: cache.TtlCache<OptOutSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutScheduleStore,
    cacheValue: cache.TtlCache<OptOutSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutSchedule | undefined {
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

  save(item: OptOutSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutSchedule[] {
    return this.inner.list();
  }
}

export function newCachedOptOutScheduleStore(inner: OptOutScheduleStore, ttl: number, clockValue: clock.Clock): OptOutScheduleStore {
  return new CachedOptOutScheduleStore(inner, cache.newTtlCache<OptOutSchedule>(1024, ttl, clockValue), 0, 0);
}

/** Selects opt out schedules. Empty fields match all. */
export class OptOutScheduleQuery {
  source: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minOpenRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutSchedule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutSchedule[]): OptOutSchedule[] {
    const matched = collections.filter(items, (candidate: OptOutSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutSchedules(store: OptOutScheduleStore, query: OptOutScheduleQuery): OptOutSchedule[] {
  return query.apply(store.list());
}

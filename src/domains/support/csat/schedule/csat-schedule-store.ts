import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatSchedule } from "./csat-schedule.js";

/** Keeps csat schedules by code. */
export interface CsatScheduleStore {
  find(code: string): CsatSchedule | undefined;
  save(item: CsatSchedule): void;
  remove(code: string): boolean;
  list(): CsatSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatScheduleStore implements CsatScheduleStore {
  items: Map<string, CsatSchedule>;
  order: string[];

  constructor(items: Map<string, CsatSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatSchedule): void {
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

  list(): CsatSchedule[] {
    const out: CsatSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatScheduleStore(): CsatScheduleStore {
  return new MemoryCsatScheduleStore(new Map<string, CsatSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatScheduleStore implements CsatScheduleStore {
  inner: CsatScheduleStore;
  cache: cache.TtlCache<CsatSchedule>;
  hits: number;
  misses: number;

  constructor(inner: CsatScheduleStore, cacheValue: cache.TtlCache<CsatSchedule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatSchedule | undefined {
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

  save(item: CsatSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatSchedule[] {
    return this.inner.list();
  }
}

export function newCachedCsatScheduleStore(inner: CsatScheduleStore, ttl: number, clockValue: clock.Clock): CsatScheduleStore {
  return new CachedCsatScheduleStore(inner, cache.newTtlCache<CsatSchedule>(512, ttl, clockValue), 0, 0);
}

/** Selects csat schedules. Empty fields match all. */
export class CsatScheduleQuery {
  country: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minOpenRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatSchedule): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatSchedule[]): CsatSchedule[] {
    const matched = collections.filter(items, (candidate: CsatSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatSchedules(store: CsatScheduleStore, query: CsatScheduleQuery): CsatSchedule[] {
  return query.apply(store.list());
}

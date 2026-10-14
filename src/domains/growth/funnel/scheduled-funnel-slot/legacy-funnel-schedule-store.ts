import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFunnelSchedule } from "./legacy-funnel-schedule.js";

/** Keeps legacy funnel schedules by code. */
export interface LegacyFunnelScheduleStore {
  find(code: string): LegacyFunnelSchedule | undefined;
  save(item: LegacyFunnelSchedule): void;
  remove(code: string): boolean;
  list(): LegacyFunnelSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFunnelScheduleStore implements LegacyFunnelScheduleStore {
  items: Map<string, LegacyFunnelSchedule>;
  order: string[];

  constructor(items: Map<string, LegacyFunnelSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFunnelSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFunnelSchedule): void {
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

  list(): LegacyFunnelSchedule[] {
    const out: LegacyFunnelSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFunnelScheduleStore(): LegacyFunnelScheduleStore {
  return new MemoryLegacyFunnelScheduleStore(new Map<string, LegacyFunnelSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFunnelScheduleStore implements LegacyFunnelScheduleStore {
  inner: LegacyFunnelScheduleStore;
  cache: cache.TtlCache<LegacyFunnelSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFunnelScheduleStore,
    cacheValue: cache.TtlCache<LegacyFunnelSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFunnelSchedule | undefined {
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

  save(item: LegacyFunnelSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFunnelSchedule[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFunnelScheduleStore(inner: LegacyFunnelScheduleStore, ttl: number, clockValue: clock.Clock): LegacyFunnelScheduleStore {
  return new CachedLegacyFunnelScheduleStore(inner, cache.newTtlCache<LegacyFunnelSchedule>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy funnel schedules. Empty fields match all. */
export class LegacyFunnelScheduleQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyFunnelSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFunnelSchedule[]): LegacyFunnelSchedule[] {
    const matched = collections.filter(items, (candidate: LegacyFunnelSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFunnelSchedules(store: LegacyFunnelScheduleStore, query: LegacyFunnelScheduleQuery): LegacyFunnelSchedule[] {
  return query.apply(store.list());
}

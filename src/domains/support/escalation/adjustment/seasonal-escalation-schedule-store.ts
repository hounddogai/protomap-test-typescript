import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalEscalationSchedule } from "./seasonal-escalation-schedule.js";

/** Keeps seasonal escalation schedules by code. */
export interface SeasonalEscalationScheduleStore {
  find(code: string): SeasonalEscalationSchedule | undefined;
  save(item: SeasonalEscalationSchedule): void;
  remove(code: string): boolean;
  list(): SeasonalEscalationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalEscalationScheduleStore implements SeasonalEscalationScheduleStore {
  items: Map<string, SeasonalEscalationSchedule>;
  order: string[];

  constructor(items: Map<string, SeasonalEscalationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalEscalationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalEscalationSchedule): void {
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

  list(): SeasonalEscalationSchedule[] {
    const out: SeasonalEscalationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalEscalationScheduleStore(): SeasonalEscalationScheduleStore {
  return new MemorySeasonalEscalationScheduleStore(new Map<string, SeasonalEscalationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalEscalationScheduleStore implements SeasonalEscalationScheduleStore {
  inner: SeasonalEscalationScheduleStore;
  cache: cache.TtlCache<SeasonalEscalationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalEscalationScheduleStore,
    cacheValue: cache.TtlCache<SeasonalEscalationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalEscalationSchedule | undefined {
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

  save(item: SeasonalEscalationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalEscalationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalEscalationScheduleStore(inner: SeasonalEscalationScheduleStore, ttl: number, clockValue: clock.Clock): SeasonalEscalationScheduleStore {
  return new CachedSeasonalEscalationScheduleStore(
    inner,
    cache.newTtlCache<SeasonalEscalationSchedule>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal escalation schedules. Empty fields match all. */
export class SeasonalEscalationScheduleQuery {
  region: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalEscalationSchedule): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalEscalationSchedule[]): SeasonalEscalationSchedule[] {
    const matched = collections.filter(items, (candidate: SeasonalEscalationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalEscalationSchedules(store: SeasonalEscalationScheduleStore, query: SeasonalEscalationScheduleQuery): SeasonalEscalationSchedule[] {
  return query.apply(store.list());
}

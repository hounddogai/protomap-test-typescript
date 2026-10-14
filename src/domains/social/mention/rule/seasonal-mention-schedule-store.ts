import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalMentionSchedule } from "./seasonal-mention-schedule.js";

/** Keeps seasonal mention schedules by code. */
export interface SeasonalMentionScheduleStore {
  find(code: string): SeasonalMentionSchedule | undefined;
  save(item: SeasonalMentionSchedule): void;
  remove(code: string): boolean;
  list(): SeasonalMentionSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalMentionScheduleStore implements SeasonalMentionScheduleStore {
  items: Map<string, SeasonalMentionSchedule>;
  order: string[];

  constructor(items: Map<string, SeasonalMentionSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalMentionSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalMentionSchedule): void {
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

  list(): SeasonalMentionSchedule[] {
    const out: SeasonalMentionSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalMentionScheduleStore(): SeasonalMentionScheduleStore {
  return new MemorySeasonalMentionScheduleStore(new Map<string, SeasonalMentionSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalMentionScheduleStore implements SeasonalMentionScheduleStore {
  inner: SeasonalMentionScheduleStore;
  cache: cache.TtlCache<SeasonalMentionSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalMentionScheduleStore,
    cacheValue: cache.TtlCache<SeasonalMentionSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalMentionSchedule | undefined {
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

  save(item: SeasonalMentionSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalMentionSchedule[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalMentionScheduleStore(inner: SeasonalMentionScheduleStore, ttl: number, clockValue: clock.Clock): SeasonalMentionScheduleStore {
  return new CachedSeasonalMentionScheduleStore(
    inner,
    cache.newTtlCache<SeasonalMentionSchedule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal mention schedules. Empty fields match all. */
export class SeasonalMentionScheduleQuery {
  region: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minEndsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalMentionSchedule): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalMentionSchedule[]): SeasonalMentionSchedule[] {
    const matched = collections.filter(items, (candidate: SeasonalMentionSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalMentionSchedules(store: SeasonalMentionScheduleStore, query: SeasonalMentionScheduleQuery): SeasonalMentionSchedule[] {
  return query.apply(store.list());
}

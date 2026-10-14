import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalBidRuleSchedule } from "./seasonal-bid-rule-schedule.js";

/** Keeps seasonal bid rule schedules by code. */
export interface SeasonalBidRuleScheduleStore {
  find(code: string): SeasonalBidRuleSchedule | undefined;
  save(item: SeasonalBidRuleSchedule): void;
  remove(code: string): boolean;
  list(): SeasonalBidRuleSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalBidRuleScheduleStore implements SeasonalBidRuleScheduleStore {
  items: Map<string, SeasonalBidRuleSchedule>;
  order: string[];

  constructor(items: Map<string, SeasonalBidRuleSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalBidRuleSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalBidRuleSchedule): void {
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

  list(): SeasonalBidRuleSchedule[] {
    const out: SeasonalBidRuleSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalBidRuleScheduleStore(): SeasonalBidRuleScheduleStore {
  return new MemorySeasonalBidRuleScheduleStore(new Map<string, SeasonalBidRuleSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalBidRuleScheduleStore implements SeasonalBidRuleScheduleStore {
  inner: SeasonalBidRuleScheduleStore;
  cache: cache.TtlCache<SeasonalBidRuleSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalBidRuleScheduleStore,
    cacheValue: cache.TtlCache<SeasonalBidRuleSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalBidRuleSchedule | undefined {
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

  save(item: SeasonalBidRuleSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalBidRuleSchedule[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalBidRuleScheduleStore(inner: SeasonalBidRuleScheduleStore, ttl: number, clockValue: clock.Clock): SeasonalBidRuleScheduleStore {
  return new CachedSeasonalBidRuleScheduleStore(
    inner,
    cache.newTtlCache<SeasonalBidRuleSchedule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal bid rule schedules. Empty fields match all. */
export class SeasonalBidRuleScheduleQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalBidRuleSchedule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalBidRuleSchedule[]): SeasonalBidRuleSchedule[] {
    const matched = collections.filter(items, (candidate: SeasonalBidRuleSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalBidRuleSchedules(store: SeasonalBidRuleScheduleStore, query: SeasonalBidRuleScheduleQuery): SeasonalBidRuleSchedule[] {
  return query.apply(store.list());
}

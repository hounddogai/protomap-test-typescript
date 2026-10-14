import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

/** Keeps seasonal paywall schedules by code. */
export interface SeasonalPaywallScheduleStore {
  find(code: string): SeasonalPaywallSchedule | undefined;
  save(item: SeasonalPaywallSchedule): void;
  remove(code: string): boolean;
  list(): SeasonalPaywallSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPaywallScheduleStore implements SeasonalPaywallScheduleStore {
  items: Map<string, SeasonalPaywallSchedule>;
  order: string[];

  constructor(items: Map<string, SeasonalPaywallSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPaywallSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPaywallSchedule): void {
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

  list(): SeasonalPaywallSchedule[] {
    const out: SeasonalPaywallSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPaywallScheduleStore(): SeasonalPaywallScheduleStore {
  return new MemorySeasonalPaywallScheduleStore(new Map<string, SeasonalPaywallSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPaywallScheduleStore implements SeasonalPaywallScheduleStore {
  inner: SeasonalPaywallScheduleStore;
  cache: cache.TtlCache<SeasonalPaywallSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPaywallScheduleStore,
    cacheValue: cache.TtlCache<SeasonalPaywallSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPaywallSchedule | undefined {
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

  save(item: SeasonalPaywallSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPaywallSchedule[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPaywallScheduleStore(inner: SeasonalPaywallScheduleStore, ttl: number, clockValue: clock.Clock): SeasonalPaywallScheduleStore {
  return new CachedSeasonalPaywallScheduleStore(
    inner,
    cache.newTtlCache<SeasonalPaywallSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal paywall schedules. Empty fields match all. */
export class SeasonalPaywallScheduleQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPaywallSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPaywallSchedule[]): SeasonalPaywallSchedule[] {
    const matched = collections.filter(items, (candidate: SeasonalPaywallSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPaywallSchedules(store: SeasonalPaywallScheduleStore, query: SeasonalPaywallScheduleQuery): SeasonalPaywallSchedule[] {
  return query.apply(store.list());
}

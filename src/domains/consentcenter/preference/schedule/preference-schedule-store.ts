import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceSchedule } from "./preference-schedule.js";

/** Keeps preference schedules by code. */
export interface PreferenceScheduleStore {
  find(code: string): PreferenceSchedule | undefined;
  save(item: PreferenceSchedule): void;
  remove(code: string): boolean;
  list(): PreferenceSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceScheduleStore implements PreferenceScheduleStore {
  items: Map<string, PreferenceSchedule>;
  order: string[];

  constructor(items: Map<string, PreferenceSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceSchedule): void {
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

  list(): PreferenceSchedule[] {
    const out: PreferenceSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceScheduleStore(): PreferenceScheduleStore {
  return new MemoryPreferenceScheduleStore(new Map<string, PreferenceSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceScheduleStore implements PreferenceScheduleStore {
  inner: PreferenceScheduleStore;
  cache: cache.TtlCache<PreferenceSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceScheduleStore,
    cacheValue: cache.TtlCache<PreferenceSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceSchedule | undefined {
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

  save(item: PreferenceSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceScheduleStore(inner: PreferenceScheduleStore, ttl: number, clockValue: clock.Clock): PreferenceScheduleStore {
  return new CachedPreferenceScheduleStore(inner, cache.newTtlCache<PreferenceSchedule>(64, ttl, clockValue), 0, 0);
}

/** Selects preference schedules. Empty fields match all. */
export class PreferenceScheduleQuery {
  locale: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceSchedule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceSchedule[]): PreferenceSchedule[] {
    const matched = collections.filter(items, (candidate: PreferenceSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceSchedules(store: PreferenceScheduleStore, query: PreferenceScheduleQuery): PreferenceSchedule[] {
  return query.apply(store.list());
}

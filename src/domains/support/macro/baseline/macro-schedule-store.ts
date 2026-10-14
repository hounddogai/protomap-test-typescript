import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroSchedule } from "./macro-schedule.js";

/** Keeps macro schedules by code. */
export interface MacroScheduleStore {
  find(code: string): MacroSchedule | undefined;
  save(item: MacroSchedule): void;
  remove(code: string): boolean;
  list(): MacroSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroScheduleStore implements MacroScheduleStore {
  items: Map<string, MacroSchedule>;
  order: string[];

  constructor(items: Map<string, MacroSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroSchedule): void {
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

  list(): MacroSchedule[] {
    const out: MacroSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroScheduleStore(): MacroScheduleStore {
  return new MemoryMacroScheduleStore(new Map<string, MacroSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroScheduleStore implements MacroScheduleStore {
  inner: MacroScheduleStore;
  cache: cache.TtlCache<MacroSchedule>;
  hits: number;
  misses: number;

  constructor(inner: MacroScheduleStore, cacheValue: cache.TtlCache<MacroSchedule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroSchedule | undefined {
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

  save(item: MacroSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroSchedule[] {
    return this.inner.list();
  }
}

export function newCachedMacroScheduleStore(inner: MacroScheduleStore, ttl: number, clockValue: clock.Clock): MacroScheduleStore {
  return new CachedMacroScheduleStore(inner, cache.newTtlCache<MacroSchedule>(128, ttl, clockValue), 0, 0);
}

/** Selects macro schedules. Empty fields match all. */
export class MacroScheduleQuery {
  country: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRetries: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroSchedule): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroSchedule[]): MacroSchedule[] {
    const matched = collections.filter(items, (candidate: MacroSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroSchedules(store: MacroScheduleStore, query: MacroScheduleQuery): MacroSchedule[] {
  return query.apply(store.list());
}

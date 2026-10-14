import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaSchedule } from "./sla-schedule.js";

/** Keeps sla schedules by code. */
export interface SlaScheduleStore {
  find(code: string): SlaSchedule | undefined;
  save(item: SlaSchedule): void;
  remove(code: string): boolean;
  list(): SlaSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaScheduleStore implements SlaScheduleStore {
  items: Map<string, SlaSchedule>;
  order: string[];

  constructor(items: Map<string, SlaSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaSchedule): void {
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

  list(): SlaSchedule[] {
    const out: SlaSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaScheduleStore(): SlaScheduleStore {
  return new MemorySlaScheduleStore(new Map<string, SlaSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaScheduleStore implements SlaScheduleStore {
  inner: SlaScheduleStore;
  cache: cache.TtlCache<SlaSchedule>;
  hits: number;
  misses: number;

  constructor(inner: SlaScheduleStore, cacheValue: cache.TtlCache<SlaSchedule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaSchedule | undefined {
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

  save(item: SlaSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaSchedule[] {
    return this.inner.list();
  }
}

export function newCachedSlaScheduleStore(inner: SlaScheduleStore, ttl: number, clockValue: clock.Clock): SlaScheduleStore {
  return new CachedSlaScheduleStore(inner, cache.newTtlCache<SlaSchedule>(128, ttl, clockValue), 0, 0);
}

/** Selects sla schedules. Empty fields match all. */
export class SlaScheduleQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaSchedule): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaSchedule[]): SlaSchedule[] {
    const matched = collections.filter(items, (candidate: SlaSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaSchedules(store: SlaScheduleStore, query: SlaScheduleQuery): SlaSchedule[] {
  return query.apply(store.list());
}

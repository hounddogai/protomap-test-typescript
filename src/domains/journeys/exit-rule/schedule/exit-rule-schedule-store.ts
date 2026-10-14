import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleSchedule } from "./exit-rule-schedule.js";

/** Keeps exit rule schedules by code. */
export interface ExitRuleScheduleStore {
  find(code: string): ExitRuleSchedule | undefined;
  save(item: ExitRuleSchedule): void;
  remove(code: string): boolean;
  list(): ExitRuleSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleScheduleStore implements ExitRuleScheduleStore {
  items: Map<string, ExitRuleSchedule>;
  order: string[];

  constructor(items: Map<string, ExitRuleSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleSchedule): void {
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

  list(): ExitRuleSchedule[] {
    const out: ExitRuleSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleScheduleStore(): ExitRuleScheduleStore {
  return new MemoryExitRuleScheduleStore(new Map<string, ExitRuleSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleScheduleStore implements ExitRuleScheduleStore {
  inner: ExitRuleScheduleStore;
  cache: cache.TtlCache<ExitRuleSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleScheduleStore,
    cacheValue: cache.TtlCache<ExitRuleSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleSchedule | undefined {
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

  save(item: ExitRuleSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleSchedule[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleScheduleStore(inner: ExitRuleScheduleStore, ttl: number, clockValue: clock.Clock): ExitRuleScheduleStore {
  return new CachedExitRuleScheduleStore(inner, cache.newTtlCache<ExitRuleSchedule>(1024, ttl, clockValue), 0, 0);
}

/** Selects exit rule schedules. Empty fields match all. */
export class ExitRuleScheduleQuery {
  source: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minEndsAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleSchedule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleSchedule[]): ExitRuleSchedule[] {
    const matched = collections.filter(items, (candidate: ExitRuleSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleSchedules(store: ExitRuleScheduleStore, query: ExitRuleScheduleQuery): ExitRuleSchedule[] {
  return query.apply(store.list());
}

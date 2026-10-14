import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualEscalationSchedule } from "./manual-escalation-schedule.js";

/** Keeps manual escalation schedules by code. */
export interface ManualEscalationScheduleStore {
  find(code: string): ManualEscalationSchedule | undefined;
  save(item: ManualEscalationSchedule): void;
  remove(code: string): boolean;
  list(): ManualEscalationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualEscalationScheduleStore implements ManualEscalationScheduleStore {
  items: Map<string, ManualEscalationSchedule>;
  order: string[];

  constructor(items: Map<string, ManualEscalationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualEscalationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualEscalationSchedule): void {
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

  list(): ManualEscalationSchedule[] {
    const out: ManualEscalationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualEscalationScheduleStore(): ManualEscalationScheduleStore {
  return new MemoryManualEscalationScheduleStore(new Map<string, ManualEscalationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualEscalationScheduleStore implements ManualEscalationScheduleStore {
  inner: ManualEscalationScheduleStore;
  cache: cache.TtlCache<ManualEscalationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualEscalationScheduleStore,
    cacheValue: cache.TtlCache<ManualEscalationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualEscalationSchedule | undefined {
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

  save(item: ManualEscalationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualEscalationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedManualEscalationScheduleStore(inner: ManualEscalationScheduleStore, ttl: number, clockValue: clock.Clock): ManualEscalationScheduleStore {
  return new CachedManualEscalationScheduleStore(
    inner,
    cache.newTtlCache<ManualEscalationSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual escalation schedules. Empty fields match all. */
export class ManualEscalationScheduleQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualEscalationSchedule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualEscalationSchedule[]): ManualEscalationSchedule[] {
    const matched = collections.filter(items, (candidate: ManualEscalationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualEscalationSchedules(store: ManualEscalationScheduleStore, query: ManualEscalationScheduleQuery): ManualEscalationSchedule[] {
  return query.apply(store.list());
}

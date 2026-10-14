import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyCreditSchedule } from "./legacy-credit-schedule.js";

/** Keeps legacy credit schedules by code. */
export interface LegacyCreditScheduleStore {
  find(code: string): LegacyCreditSchedule | undefined;
  save(item: LegacyCreditSchedule): void;
  remove(code: string): boolean;
  list(): LegacyCreditSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyCreditScheduleStore implements LegacyCreditScheduleStore {
  items: Map<string, LegacyCreditSchedule>;
  order: string[];

  constructor(items: Map<string, LegacyCreditSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyCreditSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyCreditSchedule): void {
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

  list(): LegacyCreditSchedule[] {
    const out: LegacyCreditSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyCreditScheduleStore(): LegacyCreditScheduleStore {
  return new MemoryLegacyCreditScheduleStore(new Map<string, LegacyCreditSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyCreditScheduleStore implements LegacyCreditScheduleStore {
  inner: LegacyCreditScheduleStore;
  cache: cache.TtlCache<LegacyCreditSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyCreditScheduleStore,
    cacheValue: cache.TtlCache<LegacyCreditSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyCreditSchedule | undefined {
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

  save(item: LegacyCreditSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyCreditSchedule[] {
    return this.inner.list();
  }
}

export function newCachedLegacyCreditScheduleStore(inner: LegacyCreditScheduleStore, ttl: number, clockValue: clock.Clock): LegacyCreditScheduleStore {
  return new CachedLegacyCreditScheduleStore(
    inner,
    cache.newTtlCache<LegacyCreditSchedule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy credit schedules. Empty fields match all. */
export class LegacyCreditScheduleQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyCreditSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyCreditSchedule[]): LegacyCreditSchedule[] {
    const matched = collections.filter(items, (candidate: LegacyCreditSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyCreditSchedules(store: LegacyCreditScheduleStore, query: LegacyCreditScheduleQuery): LegacyCreditSchedule[] {
  return query.apply(store.list());
}

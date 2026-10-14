import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

/** Keeps tiered subscription schedules by code. */
export interface TieredSubscriptionScheduleStore {
  find(code: string): TieredSubscriptionSchedule | undefined;
  save(item: TieredSubscriptionSchedule): void;
  remove(code: string): boolean;
  list(): TieredSubscriptionSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSubscriptionScheduleStore implements TieredSubscriptionScheduleStore {
  items: Map<string, TieredSubscriptionSchedule>;
  order: string[];

  constructor(items: Map<string, TieredSubscriptionSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSubscriptionSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSubscriptionSchedule): void {
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

  list(): TieredSubscriptionSchedule[] {
    const out: TieredSubscriptionSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSubscriptionScheduleStore(): TieredSubscriptionScheduleStore {
  return new MemoryTieredSubscriptionScheduleStore(new Map<string, TieredSubscriptionSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSubscriptionScheduleStore implements TieredSubscriptionScheduleStore {
  inner: TieredSubscriptionScheduleStore;
  cache: cache.TtlCache<TieredSubscriptionSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSubscriptionScheduleStore,
    cacheValue: cache.TtlCache<TieredSubscriptionSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSubscriptionSchedule | undefined {
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

  save(item: TieredSubscriptionSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSubscriptionSchedule[] {
    return this.inner.list();
  }
}

export function newCachedTieredSubscriptionScheduleStore(inner: TieredSubscriptionScheduleStore, ttl: number, clockValue: clock.Clock): TieredSubscriptionScheduleStore {
  return new CachedTieredSubscriptionScheduleStore(
    inner,
    cache.newTtlCache<TieredSubscriptionSchedule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered subscription schedules. Empty fields match all. */
export class TieredSubscriptionScheduleQuery {
  label: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSubscriptionSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSubscriptionSchedule[]): TieredSubscriptionSchedule[] {
    const matched = collections.filter(items, (candidate: TieredSubscriptionSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSubscriptionSchedules(store: TieredSubscriptionScheduleStore, query: TieredSubscriptionScheduleQuery): TieredSubscriptionSchedule[] {
  return query.apply(store.list());
}

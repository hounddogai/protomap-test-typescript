import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPayoutSchedule } from "./capped-payout-schedule.js";

/** Keeps capped payout schedules by code. */
export interface CappedPayoutScheduleStore {
  find(code: string): CappedPayoutSchedule | undefined;
  save(item: CappedPayoutSchedule): void;
  remove(code: string): boolean;
  list(): CappedPayoutSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPayoutScheduleStore implements CappedPayoutScheduleStore {
  items: Map<string, CappedPayoutSchedule>;
  order: string[];

  constructor(items: Map<string, CappedPayoutSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPayoutSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPayoutSchedule): void {
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

  list(): CappedPayoutSchedule[] {
    const out: CappedPayoutSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPayoutScheduleStore(): CappedPayoutScheduleStore {
  return new MemoryCappedPayoutScheduleStore(new Map<string, CappedPayoutSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPayoutScheduleStore implements CappedPayoutScheduleStore {
  inner: CappedPayoutScheduleStore;
  cache: cache.TtlCache<CappedPayoutSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPayoutScheduleStore,
    cacheValue: cache.TtlCache<CappedPayoutSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPayoutSchedule | undefined {
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

  save(item: CappedPayoutSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPayoutSchedule[] {
    return this.inner.list();
  }
}

export function newCachedCappedPayoutScheduleStore(inner: CappedPayoutScheduleStore, ttl: number, clockValue: clock.Clock): CappedPayoutScheduleStore {
  return new CachedCappedPayoutScheduleStore(
    inner,
    cache.newTtlCache<CappedPayoutSchedule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped payout schedules. Empty fields match all. */
export class CappedPayoutScheduleQuery {
  region: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minWeight: number, statuses: string[], limit: number) {
    this.region = region;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPayoutSchedule): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPayoutSchedule[]): CappedPayoutSchedule[] {
    const matched = collections.filter(items, (candidate: CappedPayoutSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPayoutSchedules(store: CappedPayoutScheduleStore, query: CappedPayoutScheduleQuery): CappedPayoutSchedule[] {
  return query.apply(store.list());
}

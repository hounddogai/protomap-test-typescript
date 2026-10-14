import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingActivationSchedule } from "./pending-activation-schedule.js";

/** Keeps pending activation schedules by code. */
export interface PendingActivationScheduleStore {
  find(code: string): PendingActivationSchedule | undefined;
  save(item: PendingActivationSchedule): void;
  remove(code: string): boolean;
  list(): PendingActivationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingActivationScheduleStore implements PendingActivationScheduleStore {
  items: Map<string, PendingActivationSchedule>;
  order: string[];

  constructor(items: Map<string, PendingActivationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingActivationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingActivationSchedule): void {
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

  list(): PendingActivationSchedule[] {
    const out: PendingActivationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingActivationScheduleStore(): PendingActivationScheduleStore {
  return new MemoryPendingActivationScheduleStore(new Map<string, PendingActivationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingActivationScheduleStore implements PendingActivationScheduleStore {
  inner: PendingActivationScheduleStore;
  cache: cache.TtlCache<PendingActivationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingActivationScheduleStore,
    cacheValue: cache.TtlCache<PendingActivationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingActivationSchedule | undefined {
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

  save(item: PendingActivationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingActivationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPendingActivationScheduleStore(inner: PendingActivationScheduleStore, ttl: number, clockValue: clock.Clock): PendingActivationScheduleStore {
  return new CachedPendingActivationScheduleStore(
    inner,
    cache.newTtlCache<PendingActivationSchedule>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending activation schedules. Empty fields match all. */
export class PendingActivationScheduleQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingActivationSchedule): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingActivationSchedule[]): PendingActivationSchedule[] {
    const matched = collections.filter(items, (candidate: PendingActivationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingActivationSchedules(store: PendingActivationScheduleStore, query: PendingActivationScheduleQuery): PendingActivationSchedule[] {
  return query.apply(store.list());
}

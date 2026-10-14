import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTicketViewSchedule } from "./primary-ticket-view-schedule.js";

/** Keeps primary ticket view schedules by code. */
export interface PrimaryTicketViewScheduleStore {
  find(code: string): PrimaryTicketViewSchedule | undefined;
  save(item: PrimaryTicketViewSchedule): void;
  remove(code: string): boolean;
  list(): PrimaryTicketViewSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTicketViewScheduleStore implements PrimaryTicketViewScheduleStore {
  items: Map<string, PrimaryTicketViewSchedule>;
  order: string[];

  constructor(items: Map<string, PrimaryTicketViewSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTicketViewSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTicketViewSchedule): void {
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

  list(): PrimaryTicketViewSchedule[] {
    const out: PrimaryTicketViewSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTicketViewScheduleStore(): PrimaryTicketViewScheduleStore {
  return new MemoryPrimaryTicketViewScheduleStore(new Map<string, PrimaryTicketViewSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTicketViewScheduleStore implements PrimaryTicketViewScheduleStore {
  inner: PrimaryTicketViewScheduleStore;
  cache: cache.TtlCache<PrimaryTicketViewSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTicketViewScheduleStore,
    cacheValue: cache.TtlCache<PrimaryTicketViewSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTicketViewSchedule | undefined {
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

  save(item: PrimaryTicketViewSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTicketViewSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTicketViewScheduleStore(inner: PrimaryTicketViewScheduleStore, ttl: number, clockValue: clock.Clock): PrimaryTicketViewScheduleStore {
  return new CachedPrimaryTicketViewScheduleStore(
    inner,
    cache.newTtlCache<PrimaryTicketViewSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary ticket view schedules. Empty fields match all. */
export class PrimaryTicketViewScheduleQuery {
  country: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBid: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTicketViewSchedule): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTicketViewSchedule[]): PrimaryTicketViewSchedule[] {
    const matched = collections.filter(items, (candidate: PrimaryTicketViewSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTicketViewSchedules(store: PrimaryTicketViewScheduleStore, query: PrimaryTicketViewScheduleQuery): PrimaryTicketViewSchedule[] {
  return query.apply(store.list());
}

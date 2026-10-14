import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewSchedule } from "./ticket-view-schedule.js";

/** Keeps ticket view schedules by code. */
export interface TicketViewScheduleStore {
  find(code: string): TicketViewSchedule | undefined;
  save(item: TicketViewSchedule): void;
  remove(code: string): boolean;
  list(): TicketViewSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewScheduleStore implements TicketViewScheduleStore {
  items: Map<string, TicketViewSchedule>;
  order: string[];

  constructor(items: Map<string, TicketViewSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewSchedule): void {
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

  list(): TicketViewSchedule[] {
    const out: TicketViewSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewScheduleStore(): TicketViewScheduleStore {
  return new MemoryTicketViewScheduleStore(new Map<string, TicketViewSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewScheduleStore implements TicketViewScheduleStore {
  inner: TicketViewScheduleStore;
  cache: cache.TtlCache<TicketViewSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewScheduleStore,
    cacheValue: cache.TtlCache<TicketViewSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewSchedule | undefined {
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

  save(item: TicketViewSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewSchedule[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewScheduleStore(inner: TicketViewScheduleStore, ttl: number, clockValue: clock.Clock): TicketViewScheduleStore {
  return new CachedTicketViewScheduleStore(inner, cache.newTtlCache<TicketViewSchedule>(128, ttl, clockValue), 0, 0);
}

/** Selects ticket view schedules. Empty fields match all. */
export class TicketViewScheduleQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewSchedule[]): TicketViewSchedule[] {
    const matched = collections.filter(items, (candidate: TicketViewSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewSchedules(store: TicketViewScheduleStore, query: TicketViewScheduleQuery): TicketViewSchedule[] {
  return query.apply(store.list());
}

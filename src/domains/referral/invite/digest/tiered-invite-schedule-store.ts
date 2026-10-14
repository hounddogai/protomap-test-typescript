import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredInviteSchedule } from "./tiered-invite-schedule.js";

/** Keeps tiered invite schedules by code. */
export interface TieredInviteScheduleStore {
  find(code: string): TieredInviteSchedule | undefined;
  save(item: TieredInviteSchedule): void;
  remove(code: string): boolean;
  list(): TieredInviteSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredInviteScheduleStore implements TieredInviteScheduleStore {
  items: Map<string, TieredInviteSchedule>;
  order: string[];

  constructor(items: Map<string, TieredInviteSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredInviteSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredInviteSchedule): void {
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

  list(): TieredInviteSchedule[] {
    const out: TieredInviteSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredInviteScheduleStore(): TieredInviteScheduleStore {
  return new MemoryTieredInviteScheduleStore(new Map<string, TieredInviteSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredInviteScheduleStore implements TieredInviteScheduleStore {
  inner: TieredInviteScheduleStore;
  cache: cache.TtlCache<TieredInviteSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredInviteScheduleStore,
    cacheValue: cache.TtlCache<TieredInviteSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredInviteSchedule | undefined {
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

  save(item: TieredInviteSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredInviteSchedule[] {
    return this.inner.list();
  }
}

export function newCachedTieredInviteScheduleStore(inner: TieredInviteScheduleStore, ttl: number, clockValue: clock.Clock): TieredInviteScheduleStore {
  return new CachedTieredInviteScheduleStore(
    inner,
    cache.newTtlCache<TieredInviteSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered invite schedules. Empty fields match all. */
export class TieredInviteScheduleQuery {
  title: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minClicks: number, statuses: string[], limit: number) {
    this.title = title;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredInviteSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredInviteSchedule[]): TieredInviteSchedule[] {
    const matched = collections.filter(items, (candidate: TieredInviteSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredInviteSchedules(store: TieredInviteScheduleStore, query: TieredInviteScheduleQuery): TieredInviteSchedule[] {
  return query.apply(store.list());
}

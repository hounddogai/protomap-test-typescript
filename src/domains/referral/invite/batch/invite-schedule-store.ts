import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteSchedule } from "./invite-schedule.js";

/** Keeps invite schedules by code. */
export interface InviteScheduleStore {
  find(code: string): InviteSchedule | undefined;
  save(item: InviteSchedule): void;
  remove(code: string): boolean;
  list(): InviteSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteScheduleStore implements InviteScheduleStore {
  items: Map<string, InviteSchedule>;
  order: string[];

  constructor(items: Map<string, InviteSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteSchedule): void {
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

  list(): InviteSchedule[] {
    const out: InviteSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteScheduleStore(): InviteScheduleStore {
  return new MemoryInviteScheduleStore(new Map<string, InviteSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteScheduleStore implements InviteScheduleStore {
  inner: InviteScheduleStore;
  cache: cache.TtlCache<InviteSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: InviteScheduleStore,
    cacheValue: cache.TtlCache<InviteSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteSchedule | undefined {
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

  save(item: InviteSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteSchedule[] {
    return this.inner.list();
  }
}

export function newCachedInviteScheduleStore(inner: InviteScheduleStore, ttl: number, clockValue: clock.Clock): InviteScheduleStore {
  return new CachedInviteScheduleStore(inner, cache.newTtlCache<InviteSchedule>(64, ttl, clockValue), 0, 0);
}

/** Selects invite schedules. Empty fields match all. */
export class InviteScheduleQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteSchedule[]): InviteSchedule[] {
    const matched = collections.filter(items, (candidate: InviteSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteSchedules(store: InviteScheduleStore, query: InviteScheduleQuery): InviteSchedule[] {
  return query.apply(store.list());
}

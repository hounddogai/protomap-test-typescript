import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictDomainSchedule } from "./strict-domain-schedule.js";

/** Keeps strict domain schedules by code. */
export interface StrictDomainScheduleStore {
  find(code: string): StrictDomainSchedule | undefined;
  save(item: StrictDomainSchedule): void;
  remove(code: string): boolean;
  list(): StrictDomainSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictDomainScheduleStore implements StrictDomainScheduleStore {
  items: Map<string, StrictDomainSchedule>;
  order: string[];

  constructor(items: Map<string, StrictDomainSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictDomainSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictDomainSchedule): void {
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

  list(): StrictDomainSchedule[] {
    const out: StrictDomainSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictDomainScheduleStore(): StrictDomainScheduleStore {
  return new MemoryStrictDomainScheduleStore(new Map<string, StrictDomainSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictDomainScheduleStore implements StrictDomainScheduleStore {
  inner: StrictDomainScheduleStore;
  cache: cache.TtlCache<StrictDomainSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictDomainScheduleStore,
    cacheValue: cache.TtlCache<StrictDomainSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictDomainSchedule | undefined {
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

  save(item: StrictDomainSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictDomainSchedule[] {
    return this.inner.list();
  }
}

export function newCachedStrictDomainScheduleStore(inner: StrictDomainScheduleStore, ttl: number, clockValue: clock.Clock): StrictDomainScheduleStore {
  return new CachedStrictDomainScheduleStore(
    inner,
    cache.newTtlCache<StrictDomainSchedule>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict domain schedules. Empty fields match all. */
export class StrictDomainScheduleQuery {
  source: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minSendAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictDomainSchedule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictDomainSchedule[]): StrictDomainSchedule[] {
    const matched = collections.filter(items, (candidate: StrictDomainSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictDomainSchedules(store: StrictDomainScheduleStore, query: StrictDomainScheduleQuery): StrictDomainSchedule[] {
  return query.apply(store.list());
}

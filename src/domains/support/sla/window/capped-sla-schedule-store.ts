import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedSlaSchedule } from "./capped-sla-schedule.js";

/** Keeps capped sla schedules by code. */
export interface CappedSlaScheduleStore {
  find(code: string): CappedSlaSchedule | undefined;
  save(item: CappedSlaSchedule): void;
  remove(code: string): boolean;
  list(): CappedSlaSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedSlaScheduleStore implements CappedSlaScheduleStore {
  items: Map<string, CappedSlaSchedule>;
  order: string[];

  constructor(items: Map<string, CappedSlaSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedSlaSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedSlaSchedule): void {
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

  list(): CappedSlaSchedule[] {
    const out: CappedSlaSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedSlaScheduleStore(): CappedSlaScheduleStore {
  return new MemoryCappedSlaScheduleStore(new Map<string, CappedSlaSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedSlaScheduleStore implements CappedSlaScheduleStore {
  inner: CappedSlaScheduleStore;
  cache: cache.TtlCache<CappedSlaSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedSlaScheduleStore,
    cacheValue: cache.TtlCache<CappedSlaSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedSlaSchedule | undefined {
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

  save(item: CappedSlaSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedSlaSchedule[] {
    return this.inner.list();
  }
}

export function newCachedCappedSlaScheduleStore(inner: CappedSlaScheduleStore, ttl: number, clockValue: clock.Clock): CappedSlaScheduleStore {
  return new CachedCappedSlaScheduleStore(inner, cache.newTtlCache<CappedSlaSchedule>(512, ttl, clockValue), 0, 0);
}

/** Selects capped sla schedules. Empty fields match all. */
export class CappedSlaScheduleQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedSlaSchedule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedSlaSchedule[]): CappedSlaSchedule[] {
    const matched = collections.filter(items, (candidate: CappedSlaSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedSlaSchedules(store: CappedSlaScheduleStore, query: CappedSlaScheduleQuery): CappedSlaSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingProofSchedule } from "./rolling-proof-schedule.js";

/** Keeps rolling proof schedules by code. */
export interface RollingProofScheduleStore {
  find(code: string): RollingProofSchedule | undefined;
  save(item: RollingProofSchedule): void;
  remove(code: string): boolean;
  list(): RollingProofSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingProofScheduleStore implements RollingProofScheduleStore {
  items: Map<string, RollingProofSchedule>;
  order: string[];

  constructor(items: Map<string, RollingProofSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingProofSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingProofSchedule): void {
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

  list(): RollingProofSchedule[] {
    const out: RollingProofSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingProofScheduleStore(): RollingProofScheduleStore {
  return new MemoryRollingProofScheduleStore(new Map<string, RollingProofSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingProofScheduleStore implements RollingProofScheduleStore {
  inner: RollingProofScheduleStore;
  cache: cache.TtlCache<RollingProofSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingProofScheduleStore,
    cacheValue: cache.TtlCache<RollingProofSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingProofSchedule | undefined {
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

  save(item: RollingProofSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingProofSchedule[] {
    return this.inner.list();
  }
}

export function newCachedRollingProofScheduleStore(inner: RollingProofScheduleStore, ttl: number, clockValue: clock.Clock): RollingProofScheduleStore {
  return new CachedRollingProofScheduleStore(
    inner,
    cache.newTtlCache<RollingProofSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling proof schedules. Empty fields match all. */
export class RollingProofScheduleQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingProofSchedule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingProofSchedule[]): RollingProofSchedule[] {
    const matched = collections.filter(items, (candidate: RollingProofSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingProofSchedules(store: RollingProofScheduleStore, query: RollingProofScheduleQuery): RollingProofSchedule[] {
  return query.apply(store.list());
}

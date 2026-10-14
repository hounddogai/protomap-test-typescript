import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchSchedule } from "./branch-schedule.js";

/** Keeps branch schedules by code. */
export interface BranchScheduleStore {
  find(code: string): BranchSchedule | undefined;
  save(item: BranchSchedule): void;
  remove(code: string): boolean;
  list(): BranchSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchScheduleStore implements BranchScheduleStore {
  items: Map<string, BranchSchedule>;
  order: string[];

  constructor(items: Map<string, BranchSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchSchedule): void {
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

  list(): BranchSchedule[] {
    const out: BranchSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchScheduleStore(): BranchScheduleStore {
  return new MemoryBranchScheduleStore(new Map<string, BranchSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchScheduleStore implements BranchScheduleStore {
  inner: BranchScheduleStore;
  cache: cache.TtlCache<BranchSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchScheduleStore,
    cacheValue: cache.TtlCache<BranchSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchSchedule | undefined {
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

  save(item: BranchSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchSchedule[] {
    return this.inner.list();
  }
}

export function newCachedBranchScheduleStore(inner: BranchScheduleStore, ttl: number, clockValue: clock.Clock): BranchScheduleStore {
  return new CachedBranchScheduleStore(inner, cache.newTtlCache<BranchSchedule>(128, ttl, clockValue), 0, 0);
}

/** Selects branch schedules. Empty fields match all. */
export class BranchScheduleQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchSchedule[]): BranchSchedule[] {
    const matched = collections.filter(items, (candidate: BranchSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchSchedules(store: BranchScheduleStore, query: BranchScheduleQuery): BranchSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { NudgeSchedule } from "./nudge-schedule.js";

/** Keeps nudge schedules by code. */
export interface NudgeScheduleStore {
  find(code: string): NudgeSchedule | undefined;
  save(item: NudgeSchedule): void;
  remove(code: string): boolean;
  list(): NudgeSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryNudgeScheduleStore implements NudgeScheduleStore {
  items: Map<string, NudgeSchedule>;
  order: string[];

  constructor(items: Map<string, NudgeSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): NudgeSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: NudgeSchedule): void {
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

  list(): NudgeSchedule[] {
    const out: NudgeSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryNudgeScheduleStore(): NudgeScheduleStore {
  return new MemoryNudgeScheduleStore(new Map<string, NudgeSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedNudgeScheduleStore implements NudgeScheduleStore {
  inner: NudgeScheduleStore;
  cache: cache.TtlCache<NudgeSchedule>;
  hits: number;
  misses: number;

  constructor(inner: NudgeScheduleStore, cacheValue: cache.TtlCache<NudgeSchedule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): NudgeSchedule | undefined {
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

  save(item: NudgeSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): NudgeSchedule[] {
    return this.inner.list();
  }
}

export function newCachedNudgeScheduleStore(inner: NudgeScheduleStore, ttl: number, clockValue: clock.Clock): NudgeScheduleStore {
  return new CachedNudgeScheduleStore(inner, cache.newTtlCache<NudgeSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects nudge schedules. Empty fields match all. */
export class NudgeScheduleQuery {
  unit: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minFloorValue: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: NudgeSchedule): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: NudgeSchedule[]): NudgeSchedule[] {
    const matched = collections.filter(items, (candidate: NudgeSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findNudgeSchedules(store: NudgeScheduleStore, query: NudgeScheduleQuery): NudgeSchedule[] {
  return query.apply(store.list());
}

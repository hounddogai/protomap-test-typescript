import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementSchedule } from "./placement-schedule.js";

/** Keeps placement schedules by code. */
export interface PlacementScheduleStore {
  find(code: string): PlacementSchedule | undefined;
  save(item: PlacementSchedule): void;
  remove(code: string): boolean;
  list(): PlacementSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementScheduleStore implements PlacementScheduleStore {
  items: Map<string, PlacementSchedule>;
  order: string[];

  constructor(items: Map<string, PlacementSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementSchedule): void {
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

  list(): PlacementSchedule[] {
    const out: PlacementSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementScheduleStore(): PlacementScheduleStore {
  return new MemoryPlacementScheduleStore(new Map<string, PlacementSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementScheduleStore implements PlacementScheduleStore {
  inner: PlacementScheduleStore;
  cache: cache.TtlCache<PlacementSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementScheduleStore,
    cacheValue: cache.TtlCache<PlacementSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementSchedule | undefined {
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

  save(item: PlacementSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPlacementScheduleStore(inner: PlacementScheduleStore, ttl: number, clockValue: clock.Clock): PlacementScheduleStore {
  return new CachedPlacementScheduleStore(inner, cache.newTtlCache<PlacementSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects placement schedules. Empty fields match all. */
export class PlacementScheduleQuery {
  region: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minVersion: number, statuses: string[], limit: number) {
    this.region = region;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementSchedule): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementSchedule[]): PlacementSchedule[] {
    const matched = collections.filter(items, (candidate: PlacementSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementSchedules(store: PlacementScheduleStore, query: PlacementScheduleQuery): PlacementSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeSchedule } from "./creative-schedule.js";

/** Keeps creative schedules by code. */
export interface CreativeScheduleStore {
  find(code: string): CreativeSchedule | undefined;
  save(item: CreativeSchedule): void;
  remove(code: string): boolean;
  list(): CreativeSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeScheduleStore implements CreativeScheduleStore {
  items: Map<string, CreativeSchedule>;
  order: string[];

  constructor(items: Map<string, CreativeSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeSchedule): void {
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

  list(): CreativeSchedule[] {
    const out: CreativeSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeScheduleStore(): CreativeScheduleStore {
  return new MemoryCreativeScheduleStore(new Map<string, CreativeSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeScheduleStore implements CreativeScheduleStore {
  inner: CreativeScheduleStore;
  cache: cache.TtlCache<CreativeSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeScheduleStore,
    cacheValue: cache.TtlCache<CreativeSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeSchedule | undefined {
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

  save(item: CreativeSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeSchedule[] {
    return this.inner.list();
  }
}

export function newCachedCreativeScheduleStore(inner: CreativeScheduleStore, ttl: number, clockValue: clock.Clock): CreativeScheduleStore {
  return new CachedCreativeScheduleStore(inner, cache.newTtlCache<CreativeSchedule>(128, ttl, clockValue), 0, 0);
}

/** Selects creative schedules. Empty fields match all. */
export class CreativeScheduleQuery {
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

  matches(item: CreativeSchedule): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeSchedule[]): CreativeSchedule[] {
    const matched = collections.filter(items, (candidate: CreativeSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeSchedules(store: CreativeScheduleStore, query: CreativeScheduleQuery): CreativeSchedule[] {
  return query.apply(store.list());
}

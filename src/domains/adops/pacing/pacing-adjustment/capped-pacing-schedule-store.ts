import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPacingSchedule } from "./capped-pacing-schedule.js";

/** Keeps capped pacing schedules by code. */
export interface CappedPacingScheduleStore {
  find(code: string): CappedPacingSchedule | undefined;
  save(item: CappedPacingSchedule): void;
  remove(code: string): boolean;
  list(): CappedPacingSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPacingScheduleStore implements CappedPacingScheduleStore {
  items: Map<string, CappedPacingSchedule>;
  order: string[];

  constructor(items: Map<string, CappedPacingSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPacingSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPacingSchedule): void {
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

  list(): CappedPacingSchedule[] {
    const out: CappedPacingSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPacingScheduleStore(): CappedPacingScheduleStore {
  return new MemoryCappedPacingScheduleStore(new Map<string, CappedPacingSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPacingScheduleStore implements CappedPacingScheduleStore {
  inner: CappedPacingScheduleStore;
  cache: cache.TtlCache<CappedPacingSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPacingScheduleStore,
    cacheValue: cache.TtlCache<CappedPacingSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPacingSchedule | undefined {
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

  save(item: CappedPacingSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPacingSchedule[] {
    return this.inner.list();
  }
}

export function newCachedCappedPacingScheduleStore(inner: CappedPacingScheduleStore, ttl: number, clockValue: clock.Clock): CappedPacingScheduleStore {
  return new CachedCappedPacingScheduleStore(
    inner,
    cache.newTtlCache<CappedPacingSchedule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped pacing schedules. Empty fields match all. */
export class CappedPacingScheduleQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPacingSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPacingSchedule[]): CappedPacingSchedule[] {
    const matched = collections.filter(items, (candidate: CappedPacingSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPacingSchedules(store: CappedPacingScheduleStore, query: CappedPacingScheduleQuery): CappedPacingSchedule[] {
  return query.apply(store.list());
}

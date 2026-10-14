import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeSchedule } from "./challenge-schedule.js";

/** Keeps challenge schedules by code. */
export interface ChallengeScheduleStore {
  find(code: string): ChallengeSchedule | undefined;
  save(item: ChallengeSchedule): void;
  remove(code: string): boolean;
  list(): ChallengeSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeScheduleStore implements ChallengeScheduleStore {
  items: Map<string, ChallengeSchedule>;
  order: string[];

  constructor(items: Map<string, ChallengeSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeSchedule): void {
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

  list(): ChallengeSchedule[] {
    const out: ChallengeSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeScheduleStore(): ChallengeScheduleStore {
  return new MemoryChallengeScheduleStore(new Map<string, ChallengeSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeScheduleStore implements ChallengeScheduleStore {
  inner: ChallengeScheduleStore;
  cache: cache.TtlCache<ChallengeSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeScheduleStore,
    cacheValue: cache.TtlCache<ChallengeSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeSchedule | undefined {
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

  save(item: ChallengeSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeSchedule[] {
    return this.inner.list();
  }
}

export function newCachedChallengeScheduleStore(inner: ChallengeScheduleStore, ttl: number, clockValue: clock.Clock): ChallengeScheduleStore {
  return new CachedChallengeScheduleStore(inner, cache.newTtlCache<ChallengeSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects challenge schedules. Empty fields match all. */
export class ChallengeScheduleQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeSchedule[]): ChallengeSchedule[] {
    const matched = collections.filter(items, (candidate: ChallengeSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeSchedules(store: ChallengeScheduleStore, query: ChallengeScheduleQuery): ChallengeSchedule[] {
  return query.apply(store.list());
}

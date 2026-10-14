import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDomainSchedule } from "./adaptive-domain-schedule.js";

/** Keeps adaptive domain schedules by code. */
export interface AdaptiveDomainScheduleStore {
  find(code: string): AdaptiveDomainSchedule | undefined;
  save(item: AdaptiveDomainSchedule): void;
  remove(code: string): boolean;
  list(): AdaptiveDomainSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDomainScheduleStore implements AdaptiveDomainScheduleStore {
  items: Map<string, AdaptiveDomainSchedule>;
  order: string[];

  constructor(items: Map<string, AdaptiveDomainSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDomainSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDomainSchedule): void {
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

  list(): AdaptiveDomainSchedule[] {
    const out: AdaptiveDomainSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDomainScheduleStore(): AdaptiveDomainScheduleStore {
  return new MemoryAdaptiveDomainScheduleStore(new Map<string, AdaptiveDomainSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDomainScheduleStore implements AdaptiveDomainScheduleStore {
  inner: AdaptiveDomainScheduleStore;
  cache: cache.TtlCache<AdaptiveDomainSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDomainScheduleStore,
    cacheValue: cache.TtlCache<AdaptiveDomainSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDomainSchedule | undefined {
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

  save(item: AdaptiveDomainSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDomainSchedule[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDomainScheduleStore(inner: AdaptiveDomainScheduleStore, ttl: number, clockValue: clock.Clock): AdaptiveDomainScheduleStore {
  return new CachedAdaptiveDomainScheduleStore(
    inner,
    cache.newTtlCache<AdaptiveDomainSchedule>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive domain schedules. Empty fields match all. */
export class AdaptiveDomainScheduleQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDomainSchedule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDomainSchedule[]): AdaptiveDomainSchedule[] {
    const matched = collections.filter(items, (candidate: AdaptiveDomainSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDomainSchedules(store: AdaptiveDomainScheduleStore, query: AdaptiveDomainScheduleQuery): AdaptiveDomainSchedule[] {
  return query.apply(store.list());
}

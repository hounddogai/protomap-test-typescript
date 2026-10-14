import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingEscalationSchedule } from "./pending-escalation-schedule.js";

/** Keeps pending escalation schedules by code. */
export interface PendingEscalationScheduleStore {
  find(code: string): PendingEscalationSchedule | undefined;
  save(item: PendingEscalationSchedule): void;
  remove(code: string): boolean;
  list(): PendingEscalationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingEscalationScheduleStore implements PendingEscalationScheduleStore {
  items: Map<string, PendingEscalationSchedule>;
  order: string[];

  constructor(items: Map<string, PendingEscalationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingEscalationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingEscalationSchedule): void {
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

  list(): PendingEscalationSchedule[] {
    const out: PendingEscalationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingEscalationScheduleStore(): PendingEscalationScheduleStore {
  return new MemoryPendingEscalationScheduleStore(new Map<string, PendingEscalationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingEscalationScheduleStore implements PendingEscalationScheduleStore {
  inner: PendingEscalationScheduleStore;
  cache: cache.TtlCache<PendingEscalationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingEscalationScheduleStore,
    cacheValue: cache.TtlCache<PendingEscalationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingEscalationSchedule | undefined {
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

  save(item: PendingEscalationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingEscalationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPendingEscalationScheduleStore(inner: PendingEscalationScheduleStore, ttl: number, clockValue: clock.Clock): PendingEscalationScheduleStore {
  return new CachedPendingEscalationScheduleStore(
    inner,
    cache.newTtlCache<PendingEscalationSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending escalation schedules. Empty fields match all. */
export class PendingEscalationScheduleQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingEscalationSchedule): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingEscalationSchedule[]): PendingEscalationSchedule[] {
    const matched = collections.filter(items, (candidate: PendingEscalationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingEscalationSchedules(store: PendingEscalationScheduleStore, query: PendingEscalationScheduleQuery): PendingEscalationSchedule[] {
  return query.apply(store.list());
}

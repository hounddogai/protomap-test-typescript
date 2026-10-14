import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingEscalationSchedule } from "./rolling-escalation-schedule.js";

/** Keeps rolling escalation schedules by code. */
export interface RollingEscalationScheduleStore {
  find(code: string): RollingEscalationSchedule | undefined;
  save(item: RollingEscalationSchedule): void;
  remove(code: string): boolean;
  list(): RollingEscalationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingEscalationScheduleStore implements RollingEscalationScheduleStore {
  items: Map<string, RollingEscalationSchedule>;
  order: string[];

  constructor(items: Map<string, RollingEscalationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingEscalationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingEscalationSchedule): void {
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

  list(): RollingEscalationSchedule[] {
    const out: RollingEscalationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingEscalationScheduleStore(): RollingEscalationScheduleStore {
  return new MemoryRollingEscalationScheduleStore(new Map<string, RollingEscalationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingEscalationScheduleStore implements RollingEscalationScheduleStore {
  inner: RollingEscalationScheduleStore;
  cache: cache.TtlCache<RollingEscalationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingEscalationScheduleStore,
    cacheValue: cache.TtlCache<RollingEscalationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingEscalationSchedule | undefined {
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

  save(item: RollingEscalationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingEscalationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedRollingEscalationScheduleStore(inner: RollingEscalationScheduleStore, ttl: number, clockValue: clock.Clock): RollingEscalationScheduleStore {
  return new CachedRollingEscalationScheduleStore(
    inner,
    cache.newTtlCache<RollingEscalationSchedule>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling escalation schedules. Empty fields match all. */
export class RollingEscalationScheduleQuery {
  label: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSequence: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingEscalationSchedule): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingEscalationSchedule[]): RollingEscalationSchedule[] {
    const matched = collections.filter(items, (candidate: RollingEscalationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingEscalationSchedules(store: RollingEscalationScheduleStore, query: RollingEscalationScheduleQuery): RollingEscalationSchedule[] {
  return query.apply(store.list());
}

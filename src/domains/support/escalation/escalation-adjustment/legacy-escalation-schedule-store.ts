import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyEscalationSchedule } from "./legacy-escalation-schedule.js";

/** Keeps legacy escalation schedules by code. */
export interface LegacyEscalationScheduleStore {
  find(code: string): LegacyEscalationSchedule | undefined;
  save(item: LegacyEscalationSchedule): void;
  remove(code: string): boolean;
  list(): LegacyEscalationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyEscalationScheduleStore implements LegacyEscalationScheduleStore {
  items: Map<string, LegacyEscalationSchedule>;
  order: string[];

  constructor(items: Map<string, LegacyEscalationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyEscalationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyEscalationSchedule): void {
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

  list(): LegacyEscalationSchedule[] {
    const out: LegacyEscalationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyEscalationScheduleStore(): LegacyEscalationScheduleStore {
  return new MemoryLegacyEscalationScheduleStore(new Map<string, LegacyEscalationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyEscalationScheduleStore implements LegacyEscalationScheduleStore {
  inner: LegacyEscalationScheduleStore;
  cache: cache.TtlCache<LegacyEscalationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyEscalationScheduleStore,
    cacheValue: cache.TtlCache<LegacyEscalationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyEscalationSchedule | undefined {
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

  save(item: LegacyEscalationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyEscalationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedLegacyEscalationScheduleStore(inner: LegacyEscalationScheduleStore, ttl: number, clockValue: clock.Clock): LegacyEscalationScheduleStore {
  return new CachedLegacyEscalationScheduleStore(
    inner,
    cache.newTtlCache<LegacyEscalationSchedule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy escalation schedules. Empty fields match all. */
export class LegacyEscalationScheduleQuery {
  category: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minWeight: number, statuses: string[], limit: number) {
    this.category = category;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyEscalationSchedule): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyEscalationSchedule[]): LegacyEscalationSchedule[] {
    const matched = collections.filter(items, (candidate: LegacyEscalationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyEscalationSchedules(store: LegacyEscalationScheduleStore, query: LegacyEscalationScheduleQuery): LegacyEscalationSchedule[] {
  return query.apply(store.list());
}

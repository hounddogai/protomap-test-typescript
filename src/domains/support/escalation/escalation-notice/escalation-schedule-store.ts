import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EscalationSchedule } from "./escalation-schedule.js";

/** Keeps escalation schedules by code. */
export interface EscalationScheduleStore {
  find(code: string): EscalationSchedule | undefined;
  save(item: EscalationSchedule): void;
  remove(code: string): boolean;
  list(): EscalationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEscalationScheduleStore implements EscalationScheduleStore {
  items: Map<string, EscalationSchedule>;
  order: string[];

  constructor(items: Map<string, EscalationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EscalationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EscalationSchedule): void {
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

  list(): EscalationSchedule[] {
    const out: EscalationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEscalationScheduleStore(): EscalationScheduleStore {
  return new MemoryEscalationScheduleStore(new Map<string, EscalationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEscalationScheduleStore implements EscalationScheduleStore {
  inner: EscalationScheduleStore;
  cache: cache.TtlCache<EscalationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: EscalationScheduleStore,
    cacheValue: cache.TtlCache<EscalationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EscalationSchedule | undefined {
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

  save(item: EscalationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EscalationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedEscalationScheduleStore(inner: EscalationScheduleStore, ttl: number, clockValue: clock.Clock): EscalationScheduleStore {
  return new CachedEscalationScheduleStore(inner, cache.newTtlCache<EscalationSchedule>(1024, ttl, clockValue), 0, 0);
}

/** Selects escalation schedules. Empty fields match all. */
export class EscalationScheduleQuery {
  source: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCost: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EscalationSchedule): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EscalationSchedule[]): EscalationSchedule[] {
    const matched = collections.filter(items, (candidate: EscalationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEscalationSchedules(store: EscalationScheduleStore, query: EscalationScheduleQuery): EscalationSchedule[] {
  return query.apply(store.list());
}

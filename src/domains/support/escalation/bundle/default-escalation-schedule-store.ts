import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultEscalationSchedule } from "./default-escalation-schedule.js";

/** Keeps default escalation schedules by code. */
export interface DefaultEscalationScheduleStore {
  find(code: string): DefaultEscalationSchedule | undefined;
  save(item: DefaultEscalationSchedule): void;
  remove(code: string): boolean;
  list(): DefaultEscalationSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultEscalationScheduleStore implements DefaultEscalationScheduleStore {
  items: Map<string, DefaultEscalationSchedule>;
  order: string[];

  constructor(items: Map<string, DefaultEscalationSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultEscalationSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultEscalationSchedule): void {
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

  list(): DefaultEscalationSchedule[] {
    const out: DefaultEscalationSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultEscalationScheduleStore(): DefaultEscalationScheduleStore {
  return new MemoryDefaultEscalationScheduleStore(new Map<string, DefaultEscalationSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultEscalationScheduleStore implements DefaultEscalationScheduleStore {
  inner: DefaultEscalationScheduleStore;
  cache: cache.TtlCache<DefaultEscalationSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultEscalationScheduleStore,
    cacheValue: cache.TtlCache<DefaultEscalationSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultEscalationSchedule | undefined {
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

  save(item: DefaultEscalationSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultEscalationSchedule[] {
    return this.inner.list();
  }
}

export function newCachedDefaultEscalationScheduleStore(inner: DefaultEscalationScheduleStore, ttl: number, clockValue: clock.Clock): DefaultEscalationScheduleStore {
  return new CachedDefaultEscalationScheduleStore(
    inner,
    cache.newTtlCache<DefaultEscalationSchedule>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default escalation schedules. Empty fields match all. */
export class DefaultEscalationScheduleQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultEscalationSchedule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultEscalationSchedule[]): DefaultEscalationSchedule[] {
    const matched = collections.filter(items, (candidate: DefaultEscalationSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultEscalationSchedules(store: DefaultEscalationScheduleStore, query: DefaultEscalationScheduleQuery): DefaultEscalationSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofSchedule } from "./proof-schedule.js";

/** Keeps proof schedules by code. */
export interface ProofScheduleStore {
  find(code: string): ProofSchedule | undefined;
  save(item: ProofSchedule): void;
  remove(code: string): boolean;
  list(): ProofSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofScheduleStore implements ProofScheduleStore {
  items: Map<string, ProofSchedule>;
  order: string[];

  constructor(items: Map<string, ProofSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofSchedule): void {
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

  list(): ProofSchedule[] {
    const out: ProofSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofScheduleStore(): ProofScheduleStore {
  return new MemoryProofScheduleStore(new Map<string, ProofSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofScheduleStore implements ProofScheduleStore {
  inner: ProofScheduleStore;
  cache: cache.TtlCache<ProofSchedule>;
  hits: number;
  misses: number;

  constructor(inner: ProofScheduleStore, cacheValue: cache.TtlCache<ProofSchedule>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofSchedule | undefined {
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

  save(item: ProofSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofSchedule[] {
    return this.inner.list();
  }
}

export function newCachedProofScheduleStore(inner: ProofScheduleStore, ttl: number, clockValue: clock.Clock): ProofScheduleStore {
  return new CachedProofScheduleStore(inner, cache.newTtlCache<ProofSchedule>(512, ttl, clockValue), 0, 0);
}

/** Selects proof schedules. Empty fields match all. */
export class ProofScheduleQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofSchedule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofSchedule[]): ProofSchedule[] {
    const matched = collections.filter(items, (candidate: ProofSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofSchedules(store: ProofScheduleStore, query: ProofScheduleQuery): ProofSchedule[] {
  return query.apply(store.list());
}

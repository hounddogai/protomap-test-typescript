import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCohortException } from "./scheduled-cohort-exception.js";

/** Keeps scheduled cohort exceptions by code. */
export interface ScheduledCohortExceptionStore {
  find(code: string): ScheduledCohortException | undefined;
  save(item: ScheduledCohortException): void;
  remove(code: string): boolean;
  list(): ScheduledCohortException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCohortExceptionStore implements ScheduledCohortExceptionStore {
  items: Map<string, ScheduledCohortException>;
  order: string[];

  constructor(items: Map<string, ScheduledCohortException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCohortException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCohortException): void {
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

  list(): ScheduledCohortException[] {
    const out: ScheduledCohortException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCohortExceptionStore(): ScheduledCohortExceptionStore {
  return new MemoryScheduledCohortExceptionStore(new Map<string, ScheduledCohortException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCohortExceptionStore implements ScheduledCohortExceptionStore {
  inner: ScheduledCohortExceptionStore;
  cache: cache.TtlCache<ScheduledCohortException>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCohortExceptionStore,
    cacheValue: cache.TtlCache<ScheduledCohortException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCohortException | undefined {
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

  save(item: ScheduledCohortException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCohortException[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCohortExceptionStore(inner: ScheduledCohortExceptionStore, ttl: number, clockValue: clock.Clock): ScheduledCohortExceptionStore {
  return new CachedScheduledCohortExceptionStore(
    inner,
    cache.newTtlCache<ScheduledCohortException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled cohort exceptions. Empty fields match all. */
export class ScheduledCohortExceptionQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledCohortException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCohortException[]): ScheduledCohortException[] {
    const matched = collections.filter(items, (candidate: ScheduledCohortException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCohortExceptions(store: ScheduledCohortExceptionStore, query: ScheduledCohortExceptionQuery): ScheduledCohortException[] {
  return query.apply(store.list());
}

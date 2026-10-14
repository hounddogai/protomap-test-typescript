import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryBidRuleSchedule } from "./primary-bid-rule-schedule.js";

/** Keeps primary bid rule schedules by code. */
export interface PrimaryBidRuleScheduleStore {
  find(code: string): PrimaryBidRuleSchedule | undefined;
  save(item: PrimaryBidRuleSchedule): void;
  remove(code: string): boolean;
  list(): PrimaryBidRuleSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryBidRuleScheduleStore implements PrimaryBidRuleScheduleStore {
  items: Map<string, PrimaryBidRuleSchedule>;
  order: string[];

  constructor(items: Map<string, PrimaryBidRuleSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryBidRuleSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryBidRuleSchedule): void {
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

  list(): PrimaryBidRuleSchedule[] {
    const out: PrimaryBidRuleSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryBidRuleScheduleStore(): PrimaryBidRuleScheduleStore {
  return new MemoryPrimaryBidRuleScheduleStore(new Map<string, PrimaryBidRuleSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryBidRuleScheduleStore implements PrimaryBidRuleScheduleStore {
  inner: PrimaryBidRuleScheduleStore;
  cache: cache.TtlCache<PrimaryBidRuleSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryBidRuleScheduleStore,
    cacheValue: cache.TtlCache<PrimaryBidRuleSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryBidRuleSchedule | undefined {
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

  save(item: PrimaryBidRuleSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryBidRuleSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryBidRuleScheduleStore(inner: PrimaryBidRuleScheduleStore, ttl: number, clockValue: clock.Clock): PrimaryBidRuleScheduleStore {
  return new CachedPrimaryBidRuleScheduleStore(
    inner,
    cache.newTtlCache<PrimaryBidRuleSchedule>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary bid rule schedules. Empty fields match all. */
export class PrimaryBidRuleScheduleQuery {
  channel: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCost: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryBidRuleSchedule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryBidRuleSchedule[]): PrimaryBidRuleSchedule[] {
    const matched = collections.filter(items, (candidate: PrimaryBidRuleSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryBidRuleSchedules(store: PrimaryBidRuleScheduleStore, query: PrimaryBidRuleScheduleQuery): PrimaryBidRuleSchedule[] {
  return query.apply(store.list());
}

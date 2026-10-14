import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleSchedule } from "./bid-rule-schedule.js";

/** Keeps bid rule schedules by code. */
export interface BidRuleScheduleStore {
  find(code: string): BidRuleSchedule | undefined;
  save(item: BidRuleSchedule): void;
  remove(code: string): boolean;
  list(): BidRuleSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleScheduleStore implements BidRuleScheduleStore {
  items: Map<string, BidRuleSchedule>;
  order: string[];

  constructor(items: Map<string, BidRuleSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleSchedule): void {
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

  list(): BidRuleSchedule[] {
    const out: BidRuleSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleScheduleStore(): BidRuleScheduleStore {
  return new MemoryBidRuleScheduleStore(new Map<string, BidRuleSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleScheduleStore implements BidRuleScheduleStore {
  inner: BidRuleScheduleStore;
  cache: cache.TtlCache<BidRuleSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleScheduleStore,
    cacheValue: cache.TtlCache<BidRuleSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleSchedule | undefined {
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

  save(item: BidRuleSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleSchedule[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleScheduleStore(inner: BidRuleScheduleStore, ttl: number, clockValue: clock.Clock): BidRuleScheduleStore {
  return new CachedBidRuleScheduleStore(inner, cache.newTtlCache<BidRuleSchedule>(256, ttl, clockValue), 0, 0);
}

/** Selects bid rule schedules. Empty fields match all. */
export class BidRuleScheduleQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleSchedule): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleSchedule[]): BidRuleSchedule[] {
    const matched = collections.filter(items, (candidate: BidRuleSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleSchedules(store: BidRuleScheduleStore, query: BidRuleScheduleQuery): BidRuleSchedule[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallSchedule } from "./paywall-schedule.js";

/** Keeps paywall schedules by code. */
export interface PaywallScheduleStore {
  find(code: string): PaywallSchedule | undefined;
  save(item: PaywallSchedule): void;
  remove(code: string): boolean;
  list(): PaywallSchedule[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallScheduleStore implements PaywallScheduleStore {
  items: Map<string, PaywallSchedule>;
  order: string[];

  constructor(items: Map<string, PaywallSchedule>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallSchedule | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallSchedule): void {
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

  list(): PaywallSchedule[] {
    const out: PaywallSchedule[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallScheduleStore(): PaywallScheduleStore {
  return new MemoryPaywallScheduleStore(new Map<string, PaywallSchedule>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallScheduleStore implements PaywallScheduleStore {
  inner: PaywallScheduleStore;
  cache: cache.TtlCache<PaywallSchedule>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallScheduleStore,
    cacheValue: cache.TtlCache<PaywallSchedule>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallSchedule | undefined {
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

  save(item: PaywallSchedule): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallSchedule[] {
    return this.inner.list();
  }
}

export function newCachedPaywallScheduleStore(inner: PaywallScheduleStore, ttl: number, clockValue: clock.Clock): PaywallScheduleStore {
  return new CachedPaywallScheduleStore(inner, cache.newTtlCache<PaywallSchedule>(64, ttl, clockValue), 0, 0);
}

/** Selects paywall schedules. Empty fields match all. */
export class PaywallScheduleQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallSchedule): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallSchedule[]): PaywallSchedule[] {
    const matched = collections.filter(items, (candidate: PaywallSchedule): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallSchedules(store: PaywallScheduleStore, query: PaywallScheduleQuery): PaywallSchedule[] {
  return query.apply(store.list());
}

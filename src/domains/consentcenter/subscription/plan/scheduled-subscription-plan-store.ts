import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledSubscriptionPlan } from "./scheduled-subscription-plan.js";

/** Keeps scheduled subscription plans by code. */
export interface ScheduledSubscriptionPlanStore {
  find(code: string): ScheduledSubscriptionPlan | undefined;
  save(item: ScheduledSubscriptionPlan): void;
  remove(code: string): boolean;
  list(): ScheduledSubscriptionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledSubscriptionPlanStore implements ScheduledSubscriptionPlanStore {
  items: Map<string, ScheduledSubscriptionPlan>;
  order: string[];

  constructor(items: Map<string, ScheduledSubscriptionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledSubscriptionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledSubscriptionPlan): void {
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

  list(): ScheduledSubscriptionPlan[] {
    const out: ScheduledSubscriptionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledSubscriptionPlanStore(): ScheduledSubscriptionPlanStore {
  return new MemoryScheduledSubscriptionPlanStore(new Map<string, ScheduledSubscriptionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledSubscriptionPlanStore implements ScheduledSubscriptionPlanStore {
  inner: ScheduledSubscriptionPlanStore;
  cache: cache.TtlCache<ScheduledSubscriptionPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledSubscriptionPlanStore,
    cacheValue: cache.TtlCache<ScheduledSubscriptionPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledSubscriptionPlan | undefined {
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

  save(item: ScheduledSubscriptionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledSubscriptionPlan[] {
    return this.inner.list();
  }
}

export function newCachedScheduledSubscriptionPlanStore(inner: ScheduledSubscriptionPlanStore, ttl: number, clockValue: clock.Clock): ScheduledSubscriptionPlanStore {
  return new CachedScheduledSubscriptionPlanStore(
    inner,
    cache.newTtlCache<ScheduledSubscriptionPlan>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled subscription plans. Empty fields match all. */
export class ScheduledSubscriptionPlanQuery {
  channel: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minVersion: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledSubscriptionPlan): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledSubscriptionPlan[]): ScheduledSubscriptionPlan[] {
    const matched = collections.filter(items, (candidate: ScheduledSubscriptionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledSubscriptionPlans(store: ScheduledSubscriptionPlanStore, query: ScheduledSubscriptionPlanQuery): ScheduledSubscriptionPlan[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelPlan } from "./funnel-plan.js";

/** Keeps funnel plans by code. */
export interface FunnelPlanStore {
  find(code: string): FunnelPlan | undefined;
  save(item: FunnelPlan): void;
  remove(code: string): boolean;
  list(): FunnelPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelPlanStore implements FunnelPlanStore {
  items: Map<string, FunnelPlan>;
  order: string[];

  constructor(items: Map<string, FunnelPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelPlan): void {
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

  list(): FunnelPlan[] {
    const out: FunnelPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelPlanStore(): FunnelPlanStore {
  return new MemoryFunnelPlanStore(new Map<string, FunnelPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelPlanStore implements FunnelPlanStore {
  inner: FunnelPlanStore;
  cache: cache.TtlCache<FunnelPlan>;
  hits: number;
  misses: number;

  constructor(inner: FunnelPlanStore, cacheValue: cache.TtlCache<FunnelPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelPlan | undefined {
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

  save(item: FunnelPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelPlan[] {
    return this.inner.list();
  }
}

export function newCachedFunnelPlanStore(inner: FunnelPlanStore, ttl: number, clockValue: clock.Clock): FunnelPlanStore {
  return new CachedFunnelPlanStore(inner, cache.newTtlCache<FunnelPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects funnel plans. Empty fields match all. */
export class FunnelPlanQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelPlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelPlan[]): FunnelPlan[] {
    const matched = collections.filter(items, (candidate: FunnelPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelPlans(store: FunnelPlanStore, query: FunnelPlanQuery): FunnelPlan[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointPlan } from "./touchpoint-plan.js";

/** Keeps touchpoint plans by code. */
export interface TouchpointPlanStore {
  find(code: string): TouchpointPlan | undefined;
  save(item: TouchpointPlan): void;
  remove(code: string): boolean;
  list(): TouchpointPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointPlanStore implements TouchpointPlanStore {
  items: Map<string, TouchpointPlan>;
  order: string[];

  constructor(items: Map<string, TouchpointPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointPlan): void {
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

  list(): TouchpointPlan[] {
    const out: TouchpointPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointPlanStore(): TouchpointPlanStore {
  return new MemoryTouchpointPlanStore(new Map<string, TouchpointPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointPlanStore implements TouchpointPlanStore {
  inner: TouchpointPlanStore;
  cache: cache.TtlCache<TouchpointPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointPlanStore,
    cacheValue: cache.TtlCache<TouchpointPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointPlan | undefined {
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

  save(item: TouchpointPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointPlan[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointPlanStore(inner: TouchpointPlanStore, ttl: number, clockValue: clock.Clock): TouchpointPlanStore {
  return new CachedTouchpointPlanStore(inner, cache.newTtlCache<TouchpointPlan>(128, ttl, clockValue), 0, 0);
}

/** Selects touchpoint plans. Empty fields match all. */
export class TouchpointPlanQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointPlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointPlan[]): TouchpointPlan[] {
    const matched = collections.filter(items, (candidate: TouchpointPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointPlans(store: TouchpointPlanStore, query: TouchpointPlanQuery): TouchpointPlan[] {
  return query.apply(store.list());
}

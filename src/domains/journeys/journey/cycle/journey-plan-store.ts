import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyPlan } from "./journey-plan.js";

/** Keeps journey plans by code. */
export interface JourneyPlanStore {
  find(code: string): JourneyPlan | undefined;
  save(item: JourneyPlan): void;
  remove(code: string): boolean;
  list(): JourneyPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyPlanStore implements JourneyPlanStore {
  items: Map<string, JourneyPlan>;
  order: string[];

  constructor(items: Map<string, JourneyPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyPlan): void {
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

  list(): JourneyPlan[] {
    const out: JourneyPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyPlanStore(): JourneyPlanStore {
  return new MemoryJourneyPlanStore(new Map<string, JourneyPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyPlanStore implements JourneyPlanStore {
  inner: JourneyPlanStore;
  cache: cache.TtlCache<JourneyPlan>;
  hits: number;
  misses: number;

  constructor(inner: JourneyPlanStore, cacheValue: cache.TtlCache<JourneyPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyPlan | undefined {
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

  save(item: JourneyPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyPlan[] {
    return this.inner.list();
  }
}

export function newCachedJourneyPlanStore(inner: JourneyPlanStore, ttl: number, clockValue: clock.Clock): JourneyPlanStore {
  return new CachedJourneyPlanStore(inner, cache.newTtlCache<JourneyPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects journey plans. Empty fields match all. */
export class JourneyPlanQuery {
  unit: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyPlan): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyPlan[]): JourneyPlan[] {
    const matched = collections.filter(items, (candidate: JourneyPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyPlans(store: JourneyPlanStore, query: JourneyPlanQuery): JourneyPlan[] {
  return query.apply(store.list());
}

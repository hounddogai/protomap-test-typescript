import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightPlan } from "./flight-plan.js";

/** Keeps flight plans by code. */
export interface FlightPlanStore {
  find(code: string): FlightPlan | undefined;
  save(item: FlightPlan): void;
  remove(code: string): boolean;
  list(): FlightPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightPlanStore implements FlightPlanStore {
  items: Map<string, FlightPlan>;
  order: string[];

  constructor(items: Map<string, FlightPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightPlan): void {
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

  list(): FlightPlan[] {
    const out: FlightPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightPlanStore(): FlightPlanStore {
  return new MemoryFlightPlanStore(new Map<string, FlightPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightPlanStore implements FlightPlanStore {
  inner: FlightPlanStore;
  cache: cache.TtlCache<FlightPlan>;
  hits: number;
  misses: number;

  constructor(inner: FlightPlanStore, cacheValue: cache.TtlCache<FlightPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightPlan | undefined {
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

  save(item: FlightPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightPlan[] {
    return this.inner.list();
  }
}

export function newCachedFlightPlanStore(inner: FlightPlanStore, ttl: number, clockValue: clock.Clock): FlightPlanStore {
  return new CachedFlightPlanStore(inner, cache.newTtlCache<FlightPlan>(256, ttl, clockValue), 0, 0);
}

/** Selects flight plans. Empty fields match all. */
export class FlightPlanQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightPlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightPlan[]): FlightPlan[] {
    const matched = collections.filter(items, (candidate: FlightPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightPlans(store: FlightPlanStore, query: FlightPlanQuery): FlightPlan[] {
  return query.apply(store.list());
}

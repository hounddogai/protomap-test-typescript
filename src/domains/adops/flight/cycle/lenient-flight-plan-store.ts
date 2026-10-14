import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientFlightPlan } from "./lenient-flight-plan.js";

/** Keeps lenient flight plans by code. */
export interface LenientFlightPlanStore {
  find(code: string): LenientFlightPlan | undefined;
  save(item: LenientFlightPlan): void;
  remove(code: string): boolean;
  list(): LenientFlightPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientFlightPlanStore implements LenientFlightPlanStore {
  items: Map<string, LenientFlightPlan>;
  order: string[];

  constructor(items: Map<string, LenientFlightPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientFlightPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientFlightPlan): void {
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

  list(): LenientFlightPlan[] {
    const out: LenientFlightPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientFlightPlanStore(): LenientFlightPlanStore {
  return new MemoryLenientFlightPlanStore(new Map<string, LenientFlightPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientFlightPlanStore implements LenientFlightPlanStore {
  inner: LenientFlightPlanStore;
  cache: cache.TtlCache<LenientFlightPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientFlightPlanStore,
    cacheValue: cache.TtlCache<LenientFlightPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientFlightPlan | undefined {
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

  save(item: LenientFlightPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientFlightPlan[] {
    return this.inner.list();
  }
}

export function newCachedLenientFlightPlanStore(inner: LenientFlightPlanStore, ttl: number, clockValue: clock.Clock): LenientFlightPlanStore {
  return new CachedLenientFlightPlanStore(inner, cache.newTtlCache<LenientFlightPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient flight plans. Empty fields match all. */
export class LenientFlightPlanQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientFlightPlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientFlightPlan[]): LenientFlightPlan[] {
    const matched = collections.filter(items, (candidate: LenientFlightPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientFlightPlans(store: LenientFlightPlanStore, query: LenientFlightPlanQuery): LenientFlightPlan[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentPlan } from "./enrollment-plan.js";

/** Keeps enrollment plans by code. */
export interface EnrollmentPlanStore {
  find(code: string): EnrollmentPlan | undefined;
  save(item: EnrollmentPlan): void;
  remove(code: string): boolean;
  list(): EnrollmentPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentPlanStore implements EnrollmentPlanStore {
  items: Map<string, EnrollmentPlan>;
  order: string[];

  constructor(items: Map<string, EnrollmentPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentPlan): void {
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

  list(): EnrollmentPlan[] {
    const out: EnrollmentPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentPlanStore(): EnrollmentPlanStore {
  return new MemoryEnrollmentPlanStore(new Map<string, EnrollmentPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentPlanStore implements EnrollmentPlanStore {
  inner: EnrollmentPlanStore;
  cache: cache.TtlCache<EnrollmentPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentPlanStore,
    cacheValue: cache.TtlCache<EnrollmentPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentPlan | undefined {
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

  save(item: EnrollmentPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentPlan[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentPlanStore(inner: EnrollmentPlanStore, ttl: number, clockValue: clock.Clock): EnrollmentPlanStore {
  return new CachedEnrollmentPlanStore(inner, cache.newTtlCache<EnrollmentPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects enrollment plans. Empty fields match all. */
export class EnrollmentPlanQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentPlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentPlan[]): EnrollmentPlan[] {
    const matched = collections.filter(items, (candidate: EnrollmentPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentPlans(store: EnrollmentPlanStore, query: EnrollmentPlanQuery): EnrollmentPlan[] {
  return query.apply(store.list());
}

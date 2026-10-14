import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualOptOutPlan } from "./manual-opt-out-plan.js";

/** Keeps manual opt out plans by code. */
export interface ManualOptOutPlanStore {
  find(code: string): ManualOptOutPlan | undefined;
  save(item: ManualOptOutPlan): void;
  remove(code: string): boolean;
  list(): ManualOptOutPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualOptOutPlanStore implements ManualOptOutPlanStore {
  items: Map<string, ManualOptOutPlan>;
  order: string[];

  constructor(items: Map<string, ManualOptOutPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualOptOutPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualOptOutPlan): void {
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

  list(): ManualOptOutPlan[] {
    const out: ManualOptOutPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualOptOutPlanStore(): ManualOptOutPlanStore {
  return new MemoryManualOptOutPlanStore(new Map<string, ManualOptOutPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualOptOutPlanStore implements ManualOptOutPlanStore {
  inner: ManualOptOutPlanStore;
  cache: cache.TtlCache<ManualOptOutPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualOptOutPlanStore,
    cacheValue: cache.TtlCache<ManualOptOutPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualOptOutPlan | undefined {
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

  save(item: ManualOptOutPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualOptOutPlan[] {
    return this.inner.list();
  }
}

export function newCachedManualOptOutPlanStore(inner: ManualOptOutPlanStore, ttl: number, clockValue: clock.Clock): ManualOptOutPlanStore {
  return new CachedManualOptOutPlanStore(inner, cache.newTtlCache<ManualOptOutPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects manual opt out plans. Empty fields match all. */
export class ManualOptOutPlanQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualOptOutPlan): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualOptOutPlan[]): ManualOptOutPlan[] {
    const matched = collections.filter(items, (candidate: ManualOptOutPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualOptOutPlans(store: ManualOptOutPlanStore, query: ManualOptOutPlanQuery): ManualOptOutPlan[] {
  return query.apply(store.list());
}

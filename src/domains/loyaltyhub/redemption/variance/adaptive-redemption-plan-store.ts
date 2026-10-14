import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

/** Keeps adaptive redemption plans by code. */
export interface AdaptiveRedemptionPlanStore {
  find(code: string): AdaptiveRedemptionPlan | undefined;
  save(item: AdaptiveRedemptionPlan): void;
  remove(code: string): boolean;
  list(): AdaptiveRedemptionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveRedemptionPlanStore implements AdaptiveRedemptionPlanStore {
  items: Map<string, AdaptiveRedemptionPlan>;
  order: string[];

  constructor(items: Map<string, AdaptiveRedemptionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveRedemptionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveRedemptionPlan): void {
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

  list(): AdaptiveRedemptionPlan[] {
    const out: AdaptiveRedemptionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveRedemptionPlanStore(): AdaptiveRedemptionPlanStore {
  return new MemoryAdaptiveRedemptionPlanStore(new Map<string, AdaptiveRedemptionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveRedemptionPlanStore implements AdaptiveRedemptionPlanStore {
  inner: AdaptiveRedemptionPlanStore;
  cache: cache.TtlCache<AdaptiveRedemptionPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveRedemptionPlanStore,
    cacheValue: cache.TtlCache<AdaptiveRedemptionPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveRedemptionPlan | undefined {
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

  save(item: AdaptiveRedemptionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveRedemptionPlan[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveRedemptionPlanStore(inner: AdaptiveRedemptionPlanStore, ttl: number, clockValue: clock.Clock): AdaptiveRedemptionPlanStore {
  return new CachedAdaptiveRedemptionPlanStore(
    inner,
    cache.newTtlCache<AdaptiveRedemptionPlan>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive redemption plans. Empty fields match all. */
export class AdaptiveRedemptionPlanQuery {
  title: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minThreshold: number, statuses: string[], limit: number) {
    this.title = title;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveRedemptionPlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveRedemptionPlan[]): AdaptiveRedemptionPlan[] {
    const matched = collections.filter(items, (candidate: AdaptiveRedemptionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveRedemptionPlans(store: AdaptiveRedemptionPlanStore, query: AdaptiveRedemptionPlanQuery): AdaptiveRedemptionPlan[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

/** Keeps adaptive double opt in plans by code. */
export interface AdaptiveDoubleOptInPlanStore {
  find(code: string): AdaptiveDoubleOptInPlan | undefined;
  save(item: AdaptiveDoubleOptInPlan): void;
  remove(code: string): boolean;
  list(): AdaptiveDoubleOptInPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDoubleOptInPlanStore implements AdaptiveDoubleOptInPlanStore {
  items: Map<string, AdaptiveDoubleOptInPlan>;
  order: string[];

  constructor(items: Map<string, AdaptiveDoubleOptInPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDoubleOptInPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDoubleOptInPlan): void {
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

  list(): AdaptiveDoubleOptInPlan[] {
    const out: AdaptiveDoubleOptInPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDoubleOptInPlanStore(): AdaptiveDoubleOptInPlanStore {
  return new MemoryAdaptiveDoubleOptInPlanStore(new Map<string, AdaptiveDoubleOptInPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDoubleOptInPlanStore implements AdaptiveDoubleOptInPlanStore {
  inner: AdaptiveDoubleOptInPlanStore;
  cache: cache.TtlCache<AdaptiveDoubleOptInPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDoubleOptInPlanStore,
    cacheValue: cache.TtlCache<AdaptiveDoubleOptInPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDoubleOptInPlan | undefined {
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

  save(item: AdaptiveDoubleOptInPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDoubleOptInPlan[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDoubleOptInPlanStore(inner: AdaptiveDoubleOptInPlanStore, ttl: number, clockValue: clock.Clock): AdaptiveDoubleOptInPlanStore {
  return new CachedAdaptiveDoubleOptInPlanStore(
    inner,
    cache.newTtlCache<AdaptiveDoubleOptInPlan>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive double opt in plans. Empty fields match all. */
export class AdaptiveDoubleOptInPlanQuery {
  utmSource: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minGraceDays: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDoubleOptInPlan): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDoubleOptInPlan[]): AdaptiveDoubleOptInPlan[] {
    const matched = collections.filter(items, (candidate: AdaptiveDoubleOptInPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDoubleOptInPlans(store: AdaptiveDoubleOptInPlanStore, query: AdaptiveDoubleOptInPlanQuery): AdaptiveDoubleOptInPlan[] {
  return query.apply(store.list());
}

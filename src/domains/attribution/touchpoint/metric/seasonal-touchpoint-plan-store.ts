import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalTouchpointPlan } from "./seasonal-touchpoint-plan.js";

/** Keeps seasonal touchpoint plans by code. */
export interface SeasonalTouchpointPlanStore {
  find(code: string): SeasonalTouchpointPlan | undefined;
  save(item: SeasonalTouchpointPlan): void;
  remove(code: string): boolean;
  list(): SeasonalTouchpointPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalTouchpointPlanStore implements SeasonalTouchpointPlanStore {
  items: Map<string, SeasonalTouchpointPlan>;
  order: string[];

  constructor(items: Map<string, SeasonalTouchpointPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalTouchpointPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalTouchpointPlan): void {
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

  list(): SeasonalTouchpointPlan[] {
    const out: SeasonalTouchpointPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalTouchpointPlanStore(): SeasonalTouchpointPlanStore {
  return new MemorySeasonalTouchpointPlanStore(new Map<string, SeasonalTouchpointPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalTouchpointPlanStore implements SeasonalTouchpointPlanStore {
  inner: SeasonalTouchpointPlanStore;
  cache: cache.TtlCache<SeasonalTouchpointPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalTouchpointPlanStore,
    cacheValue: cache.TtlCache<SeasonalTouchpointPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalTouchpointPlan | undefined {
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

  save(item: SeasonalTouchpointPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalTouchpointPlan[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalTouchpointPlanStore(inner: SeasonalTouchpointPlanStore, ttl: number, clockValue: clock.Clock): SeasonalTouchpointPlanStore {
  return new CachedSeasonalTouchpointPlanStore(
    inner,
    cache.newTtlCache<SeasonalTouchpointPlan>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal touchpoint plans. Empty fields match all. */
export class SeasonalTouchpointPlanQuery {
  country: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBid: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalTouchpointPlan): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalTouchpointPlan[]): SeasonalTouchpointPlan[] {
    const matched = collections.filter(items, (candidate: SeasonalTouchpointPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalTouchpointPlans(store: SeasonalTouchpointPlanStore, query: SeasonalTouchpointPlanQuery): SeasonalTouchpointPlan[] {
  return query.apply(store.list());
}

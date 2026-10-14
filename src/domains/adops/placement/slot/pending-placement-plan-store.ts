import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPlacementPlan } from "./pending-placement-plan.js";

/** Keeps pending placement plans by code. */
export interface PendingPlacementPlanStore {
  find(code: string): PendingPlacementPlan | undefined;
  save(item: PendingPlacementPlan): void;
  remove(code: string): boolean;
  list(): PendingPlacementPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPlacementPlanStore implements PendingPlacementPlanStore {
  items: Map<string, PendingPlacementPlan>;
  order: string[];

  constructor(items: Map<string, PendingPlacementPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPlacementPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPlacementPlan): void {
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

  list(): PendingPlacementPlan[] {
    const out: PendingPlacementPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPlacementPlanStore(): PendingPlacementPlanStore {
  return new MemoryPendingPlacementPlanStore(new Map<string, PendingPlacementPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPlacementPlanStore implements PendingPlacementPlanStore {
  inner: PendingPlacementPlanStore;
  cache: cache.TtlCache<PendingPlacementPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPlacementPlanStore,
    cacheValue: cache.TtlCache<PendingPlacementPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPlacementPlan | undefined {
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

  save(item: PendingPlacementPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPlacementPlan[] {
    return this.inner.list();
  }
}

export function newCachedPendingPlacementPlanStore(inner: PendingPlacementPlanStore, ttl: number, clockValue: clock.Clock): PendingPlacementPlanStore {
  return new CachedPendingPlacementPlanStore(
    inner,
    cache.newTtlCache<PendingPlacementPlan>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending placement plans. Empty fields match all. */
export class PendingPlacementPlanQuery {
  region: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCapacity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPlacementPlan): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPlacementPlan[]): PendingPlacementPlan[] {
    const matched = collections.filter(items, (candidate: PendingPlacementPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPlacementPlans(store: PendingPlacementPlanStore, query: PendingPlacementPlanQuery): PendingPlacementPlan[] {
  return query.apply(store.list());
}

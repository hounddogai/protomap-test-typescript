import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredDoubleOptInPlan } from "./tiered-double-opt-in-plan.js";

/** Keeps tiered double opt in plans by code. */
export interface TieredDoubleOptInPlanStore {
  find(code: string): TieredDoubleOptInPlan | undefined;
  save(item: TieredDoubleOptInPlan): void;
  remove(code: string): boolean;
  list(): TieredDoubleOptInPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredDoubleOptInPlanStore implements TieredDoubleOptInPlanStore {
  items: Map<string, TieredDoubleOptInPlan>;
  order: string[];

  constructor(items: Map<string, TieredDoubleOptInPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredDoubleOptInPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredDoubleOptInPlan): void {
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

  list(): TieredDoubleOptInPlan[] {
    const out: TieredDoubleOptInPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredDoubleOptInPlanStore(): TieredDoubleOptInPlanStore {
  return new MemoryTieredDoubleOptInPlanStore(new Map<string, TieredDoubleOptInPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredDoubleOptInPlanStore implements TieredDoubleOptInPlanStore {
  inner: TieredDoubleOptInPlanStore;
  cache: cache.TtlCache<TieredDoubleOptInPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredDoubleOptInPlanStore,
    cacheValue: cache.TtlCache<TieredDoubleOptInPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredDoubleOptInPlan | undefined {
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

  save(item: TieredDoubleOptInPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredDoubleOptInPlan[] {
    return this.inner.list();
  }
}

export function newCachedTieredDoubleOptInPlanStore(inner: TieredDoubleOptInPlanStore, ttl: number, clockValue: clock.Clock): TieredDoubleOptInPlanStore {
  return new CachedTieredDoubleOptInPlanStore(
    inner,
    cache.newTtlCache<TieredDoubleOptInPlan>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered double opt in plans. Empty fields match all. */
export class TieredDoubleOptInPlanQuery {
  category: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minVersion: number, statuses: string[], limit: number) {
    this.category = category;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredDoubleOptInPlan): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredDoubleOptInPlan[]): TieredDoubleOptInPlan[] {
    const matched = collections.filter(items, (candidate: TieredDoubleOptInPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredDoubleOptInPlans(store: TieredDoubleOptInPlanStore, query: TieredDoubleOptInPlanQuery): TieredDoubleOptInPlan[] {
  return query.apply(store.list());
}

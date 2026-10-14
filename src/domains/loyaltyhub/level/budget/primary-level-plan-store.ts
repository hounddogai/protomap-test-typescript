import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryLevelPlan } from "./primary-level-plan.js";

/** Keeps primary level plans by code. */
export interface PrimaryLevelPlanStore {
  find(code: string): PrimaryLevelPlan | undefined;
  save(item: PrimaryLevelPlan): void;
  remove(code: string): boolean;
  list(): PrimaryLevelPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryLevelPlanStore implements PrimaryLevelPlanStore {
  items: Map<string, PrimaryLevelPlan>;
  order: string[];

  constructor(items: Map<string, PrimaryLevelPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryLevelPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryLevelPlan): void {
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

  list(): PrimaryLevelPlan[] {
    const out: PrimaryLevelPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryLevelPlanStore(): PrimaryLevelPlanStore {
  return new MemoryPrimaryLevelPlanStore(new Map<string, PrimaryLevelPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryLevelPlanStore implements PrimaryLevelPlanStore {
  inner: PrimaryLevelPlanStore;
  cache: cache.TtlCache<PrimaryLevelPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryLevelPlanStore,
    cacheValue: cache.TtlCache<PrimaryLevelPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryLevelPlan | undefined {
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

  save(item: PrimaryLevelPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryLevelPlan[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryLevelPlanStore(inner: PrimaryLevelPlanStore, ttl: number, clockValue: clock.Clock): PrimaryLevelPlanStore {
  return new CachedPrimaryLevelPlanStore(inner, cache.newTtlCache<PrimaryLevelPlan>(128, ttl, clockValue), 0, 0);
}

/** Selects primary level plans. Empty fields match all. */
export class PrimaryLevelPlanQuery {
  unit: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBid: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryLevelPlan): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryLevelPlan[]): PrimaryLevelPlan[] {
    const matched = collections.filter(items, (candidate: PrimaryLevelPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryLevelPlans(store: PrimaryLevelPlanStore, query: PrimaryLevelPlanQuery): PrimaryLevelPlan[] {
  return query.apply(store.list());
}

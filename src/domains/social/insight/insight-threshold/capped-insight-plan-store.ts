import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedInsightPlan } from "./capped-insight-plan.js";

/** Keeps capped insight plans by code. */
export interface CappedInsightPlanStore {
  find(code: string): CappedInsightPlan | undefined;
  save(item: CappedInsightPlan): void;
  remove(code: string): boolean;
  list(): CappedInsightPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedInsightPlanStore implements CappedInsightPlanStore {
  items: Map<string, CappedInsightPlan>;
  order: string[];

  constructor(items: Map<string, CappedInsightPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedInsightPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedInsightPlan): void {
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

  list(): CappedInsightPlan[] {
    const out: CappedInsightPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedInsightPlanStore(): CappedInsightPlanStore {
  return new MemoryCappedInsightPlanStore(new Map<string, CappedInsightPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedInsightPlanStore implements CappedInsightPlanStore {
  inner: CappedInsightPlanStore;
  cache: cache.TtlCache<CappedInsightPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedInsightPlanStore,
    cacheValue: cache.TtlCache<CappedInsightPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedInsightPlan | undefined {
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

  save(item: CappedInsightPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedInsightPlan[] {
    return this.inner.list();
  }
}

export function newCachedCappedInsightPlanStore(inner: CappedInsightPlanStore, ttl: number, clockValue: clock.Clock): CappedInsightPlanStore {
  return new CachedCappedInsightPlanStore(inner, cache.newTtlCache<CappedInsightPlan>(256, ttl, clockValue), 0, 0);
}

/** Selects capped insight plans. Empty fields match all. */
export class CappedInsightPlanQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedInsightPlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedInsightPlan[]): CappedInsightPlan[] {
    const matched = collections.filter(items, (candidate: CappedInsightPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedInsightPlans(store: CappedInsightPlanStore, query: CappedInsightPlanQuery): CappedInsightPlan[] {
  return query.apply(store.list());
}

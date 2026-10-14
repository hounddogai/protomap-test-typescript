import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualLevelPlan } from "./manual-level-plan.js";

/** Keeps manual level plans by code. */
export interface ManualLevelPlanStore {
  find(code: string): ManualLevelPlan | undefined;
  save(item: ManualLevelPlan): void;
  remove(code: string): boolean;
  list(): ManualLevelPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualLevelPlanStore implements ManualLevelPlanStore {
  items: Map<string, ManualLevelPlan>;
  order: string[];

  constructor(items: Map<string, ManualLevelPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualLevelPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualLevelPlan): void {
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

  list(): ManualLevelPlan[] {
    const out: ManualLevelPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualLevelPlanStore(): ManualLevelPlanStore {
  return new MemoryManualLevelPlanStore(new Map<string, ManualLevelPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualLevelPlanStore implements ManualLevelPlanStore {
  inner: ManualLevelPlanStore;
  cache: cache.TtlCache<ManualLevelPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualLevelPlanStore,
    cacheValue: cache.TtlCache<ManualLevelPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualLevelPlan | undefined {
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

  save(item: ManualLevelPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualLevelPlan[] {
    return this.inner.list();
  }
}

export function newCachedManualLevelPlanStore(inner: ManualLevelPlanStore, ttl: number, clockValue: clock.Clock): ManualLevelPlanStore {
  return new CachedManualLevelPlanStore(inner, cache.newTtlCache<ManualLevelPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects manual level plans. Empty fields match all. */
export class ManualLevelPlanQuery {
  unit: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAttempts: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualLevelPlan): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualLevelPlan[]): ManualLevelPlan[] {
    const matched = collections.filter(items, (candidate: ManualLevelPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualLevelPlans(store: ManualLevelPlanStore, query: ManualLevelPlanQuery): ManualLevelPlan[] {
  return query.apply(store.list());
}

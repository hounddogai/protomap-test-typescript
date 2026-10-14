import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationPlan } from "./activation-plan.js";

/** Keeps activation plans by code. */
export interface ActivationPlanStore {
  find(code: string): ActivationPlan | undefined;
  save(item: ActivationPlan): void;
  remove(code: string): boolean;
  list(): ActivationPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationPlanStore implements ActivationPlanStore {
  items: Map<string, ActivationPlan>;
  order: string[];

  constructor(items: Map<string, ActivationPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationPlan): void {
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

  list(): ActivationPlan[] {
    const out: ActivationPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationPlanStore(): ActivationPlanStore {
  return new MemoryActivationPlanStore(new Map<string, ActivationPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationPlanStore implements ActivationPlanStore {
  inner: ActivationPlanStore;
  cache: cache.TtlCache<ActivationPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationPlanStore,
    cacheValue: cache.TtlCache<ActivationPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationPlan | undefined {
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

  save(item: ActivationPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationPlan[] {
    return this.inner.list();
  }
}

export function newCachedActivationPlanStore(inner: ActivationPlanStore, ttl: number, clockValue: clock.Clock): ActivationPlanStore {
  return new CachedActivationPlanStore(inner, cache.newTtlCache<ActivationPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects activation plans. Empty fields match all. */
export class ActivationPlanQuery {
  unit: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minImpressions: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationPlan): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationPlan[]): ActivationPlan[] {
    const matched = collections.filter(items, (candidate: ActivationPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationPlans(store: ActivationPlanStore, query: ActivationPlanQuery): ActivationPlan[] {
  return query.apply(store.list());
}

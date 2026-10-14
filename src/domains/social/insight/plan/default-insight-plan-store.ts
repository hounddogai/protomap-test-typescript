import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultInsightPlan } from "./default-insight-plan.js";

/** Keeps default insight plans by code. */
export interface DefaultInsightPlanStore {
  find(code: string): DefaultInsightPlan | undefined;
  save(item: DefaultInsightPlan): void;
  remove(code: string): boolean;
  list(): DefaultInsightPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultInsightPlanStore implements DefaultInsightPlanStore {
  items: Map<string, DefaultInsightPlan>;
  order: string[];

  constructor(items: Map<string, DefaultInsightPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultInsightPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultInsightPlan): void {
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

  list(): DefaultInsightPlan[] {
    const out: DefaultInsightPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultInsightPlanStore(): DefaultInsightPlanStore {
  return new MemoryDefaultInsightPlanStore(new Map<string, DefaultInsightPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultInsightPlanStore implements DefaultInsightPlanStore {
  inner: DefaultInsightPlanStore;
  cache: cache.TtlCache<DefaultInsightPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultInsightPlanStore,
    cacheValue: cache.TtlCache<DefaultInsightPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultInsightPlan | undefined {
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

  save(item: DefaultInsightPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultInsightPlan[] {
    return this.inner.list();
  }
}

export function newCachedDefaultInsightPlanStore(inner: DefaultInsightPlanStore, ttl: number, clockValue: clock.Clock): DefaultInsightPlanStore {
  return new CachedDefaultInsightPlanStore(inner, cache.newTtlCache<DefaultInsightPlan>(128, ttl, clockValue), 0, 0);
}

/** Selects default insight plans. Empty fields match all. */
export class DefaultInsightPlanQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultInsightPlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultInsightPlan[]): DefaultInsightPlan[] {
    const matched = collections.filter(items, (candidate: DefaultInsightPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultInsightPlans(store: DefaultInsightPlanStore, query: DefaultInsightPlanQuery): DefaultInsightPlan[] {
  return query.apply(store.list());
}

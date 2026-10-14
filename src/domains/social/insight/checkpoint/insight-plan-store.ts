import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightPlan } from "./insight-plan.js";

/** Keeps insight plans by code. */
export interface InsightPlanStore {
  find(code: string): InsightPlan | undefined;
  save(item: InsightPlan): void;
  remove(code: string): boolean;
  list(): InsightPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightPlanStore implements InsightPlanStore {
  items: Map<string, InsightPlan>;
  order: string[];

  constructor(items: Map<string, InsightPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightPlan): void {
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

  list(): InsightPlan[] {
    const out: InsightPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightPlanStore(): InsightPlanStore {
  return new MemoryInsightPlanStore(new Map<string, InsightPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightPlanStore implements InsightPlanStore {
  inner: InsightPlanStore;
  cache: cache.TtlCache<InsightPlan>;
  hits: number;
  misses: number;

  constructor(inner: InsightPlanStore, cacheValue: cache.TtlCache<InsightPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightPlan | undefined {
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

  save(item: InsightPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightPlan[] {
    return this.inner.list();
  }
}

export function newCachedInsightPlanStore(inner: InsightPlanStore, ttl: number, clockValue: clock.Clock): InsightPlanStore {
  return new CachedInsightPlanStore(inner, cache.newTtlCache<InsightPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects insight plans. Empty fields match all. */
export class InsightPlanQuery {
  source: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minStartsAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightPlan): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightPlan[]): InsightPlan[] {
    const matched = collections.filter(items, (candidate: InsightPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightPlans(store: InsightPlanStore, query: InsightPlanQuery): InsightPlan[] {
  return query.apply(store.list());
}

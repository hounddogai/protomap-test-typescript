import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionPlan } from "./retention-plan.js";

/** Keeps retention plans by code. */
export interface RetentionPlanStore {
  find(code: string): RetentionPlan | undefined;
  save(item: RetentionPlan): void;
  remove(code: string): boolean;
  list(): RetentionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionPlanStore implements RetentionPlanStore {
  items: Map<string, RetentionPlan>;
  order: string[];

  constructor(items: Map<string, RetentionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionPlan): void {
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

  list(): RetentionPlan[] {
    const out: RetentionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionPlanStore(): RetentionPlanStore {
  return new MemoryRetentionPlanStore(new Map<string, RetentionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionPlanStore implements RetentionPlanStore {
  inner: RetentionPlanStore;
  cache: cache.TtlCache<RetentionPlan>;
  hits: number;
  misses: number;

  constructor(inner: RetentionPlanStore, cacheValue: cache.TtlCache<RetentionPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionPlan | undefined {
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

  save(item: RetentionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionPlan[] {
    return this.inner.list();
  }
}

export function newCachedRetentionPlanStore(inner: RetentionPlanStore, ttl: number, clockValue: clock.Clock): RetentionPlanStore {
  return new CachedRetentionPlanStore(inner, cache.newTtlCache<RetentionPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects retention plans. Empty fields match all. */
export class RetentionPlanQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionPlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionPlan[]): RetentionPlan[] {
    const matched = collections.filter(items, (candidate: RetentionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionPlans(store: RetentionPlanStore, query: RetentionPlanQuery): RetentionPlan[] {
  return query.apply(store.list());
}

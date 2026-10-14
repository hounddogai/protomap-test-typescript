import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionPlan } from "./redemption-plan.js";

/** Keeps redemption plans by code. */
export interface RedemptionPlanStore {
  find(code: string): RedemptionPlan | undefined;
  save(item: RedemptionPlan): void;
  remove(code: string): boolean;
  list(): RedemptionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionPlanStore implements RedemptionPlanStore {
  items: Map<string, RedemptionPlan>;
  order: string[];

  constructor(items: Map<string, RedemptionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionPlan): void {
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

  list(): RedemptionPlan[] {
    const out: RedemptionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionPlanStore(): RedemptionPlanStore {
  return new MemoryRedemptionPlanStore(new Map<string, RedemptionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionPlanStore implements RedemptionPlanStore {
  inner: RedemptionPlanStore;
  cache: cache.TtlCache<RedemptionPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionPlanStore,
    cacheValue: cache.TtlCache<RedemptionPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionPlan | undefined {
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

  save(item: RedemptionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionPlan[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionPlanStore(inner: RedemptionPlanStore, ttl: number, clockValue: clock.Clock): RedemptionPlanStore {
  return new CachedRedemptionPlanStore(inner, cache.newTtlCache<RedemptionPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects redemption plans. Empty fields match all. */
export class RedemptionPlanQuery {
  utmSource: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minPriority: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionPlan): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionPlan[]): RedemptionPlan[] {
    const matched = collections.filter(items, (candidate: RedemptionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionPlans(store: RedemptionPlanStore, query: RedemptionPlanQuery): RedemptionPlan[] {
  return query.apply(store.list());
}

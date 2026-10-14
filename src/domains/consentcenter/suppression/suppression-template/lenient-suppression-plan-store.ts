import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientSuppressionPlan } from "./lenient-suppression-plan.js";

/** Keeps lenient suppression plans by code. */
export interface LenientSuppressionPlanStore {
  find(code: string): LenientSuppressionPlan | undefined;
  save(item: LenientSuppressionPlan): void;
  remove(code: string): boolean;
  list(): LenientSuppressionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientSuppressionPlanStore implements LenientSuppressionPlanStore {
  items: Map<string, LenientSuppressionPlan>;
  order: string[];

  constructor(items: Map<string, LenientSuppressionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientSuppressionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientSuppressionPlan): void {
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

  list(): LenientSuppressionPlan[] {
    const out: LenientSuppressionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientSuppressionPlanStore(): LenientSuppressionPlanStore {
  return new MemoryLenientSuppressionPlanStore(new Map<string, LenientSuppressionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientSuppressionPlanStore implements LenientSuppressionPlanStore {
  inner: LenientSuppressionPlanStore;
  cache: cache.TtlCache<LenientSuppressionPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientSuppressionPlanStore,
    cacheValue: cache.TtlCache<LenientSuppressionPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientSuppressionPlan | undefined {
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

  save(item: LenientSuppressionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientSuppressionPlan[] {
    return this.inner.list();
  }
}

export function newCachedLenientSuppressionPlanStore(inner: LenientSuppressionPlanStore, ttl: number, clockValue: clock.Clock): LenientSuppressionPlanStore {
  return new CachedLenientSuppressionPlanStore(
    inner,
    cache.newTtlCache<LenientSuppressionPlan>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient suppression plans. Empty fields match all. */
export class LenientSuppressionPlanQuery {
  source: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minDiscount: number, statuses: string[], limit: number) {
    this.source = source;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientSuppressionPlan): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientSuppressionPlan[]): LenientSuppressionPlan[] {
    const matched = collections.filter(items, (candidate: LenientSuppressionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientSuppressionPlans(store: LenientSuppressionPlanStore, query: LenientSuppressionPlanQuery): LenientSuppressionPlan[] {
  return query.apply(store.list());
}

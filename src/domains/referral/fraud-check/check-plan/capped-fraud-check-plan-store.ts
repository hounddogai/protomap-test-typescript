import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedFraudCheckPlan } from "./capped-fraud-check-plan.js";

/** Keeps capped fraud check plans by code. */
export interface CappedFraudCheckPlanStore {
  find(code: string): CappedFraudCheckPlan | undefined;
  save(item: CappedFraudCheckPlan): void;
  remove(code: string): boolean;
  list(): CappedFraudCheckPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedFraudCheckPlanStore implements CappedFraudCheckPlanStore {
  items: Map<string, CappedFraudCheckPlan>;
  order: string[];

  constructor(items: Map<string, CappedFraudCheckPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedFraudCheckPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedFraudCheckPlan): void {
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

  list(): CappedFraudCheckPlan[] {
    const out: CappedFraudCheckPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedFraudCheckPlanStore(): CappedFraudCheckPlanStore {
  return new MemoryCappedFraudCheckPlanStore(new Map<string, CappedFraudCheckPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedFraudCheckPlanStore implements CappedFraudCheckPlanStore {
  inner: CappedFraudCheckPlanStore;
  cache: cache.TtlCache<CappedFraudCheckPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedFraudCheckPlanStore,
    cacheValue: cache.TtlCache<CappedFraudCheckPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedFraudCheckPlan | undefined {
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

  save(item: CappedFraudCheckPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedFraudCheckPlan[] {
    return this.inner.list();
  }
}

export function newCachedCappedFraudCheckPlanStore(inner: CappedFraudCheckPlanStore, ttl: number, clockValue: clock.Clock): CappedFraudCheckPlanStore {
  return new CachedCappedFraudCheckPlanStore(
    inner,
    cache.newTtlCache<CappedFraudCheckPlan>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped fraud check plans. Empty fields match all. */
export class CappedFraudCheckPlanQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedFraudCheckPlan): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedFraudCheckPlan[]): CappedFraudCheckPlan[] {
    const matched = collections.filter(items, (candidate: CappedFraudCheckPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedFraudCheckPlans(store: CappedFraudCheckPlanStore, query: CappedFraudCheckPlanQuery): CappedFraudCheckPlan[] {
  return query.apply(store.list());
}

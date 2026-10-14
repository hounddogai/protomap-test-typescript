import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

/** Keeps manual fraud check plans by code. */
export interface ManualFraudCheckPlanStore {
  find(code: string): ManualFraudCheckPlan | undefined;
  save(item: ManualFraudCheckPlan): void;
  remove(code: string): boolean;
  list(): ManualFraudCheckPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualFraudCheckPlanStore implements ManualFraudCheckPlanStore {
  items: Map<string, ManualFraudCheckPlan>;
  order: string[];

  constructor(items: Map<string, ManualFraudCheckPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualFraudCheckPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualFraudCheckPlan): void {
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

  list(): ManualFraudCheckPlan[] {
    const out: ManualFraudCheckPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualFraudCheckPlanStore(): ManualFraudCheckPlanStore {
  return new MemoryManualFraudCheckPlanStore(new Map<string, ManualFraudCheckPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualFraudCheckPlanStore implements ManualFraudCheckPlanStore {
  inner: ManualFraudCheckPlanStore;
  cache: cache.TtlCache<ManualFraudCheckPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualFraudCheckPlanStore,
    cacheValue: cache.TtlCache<ManualFraudCheckPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualFraudCheckPlan | undefined {
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

  save(item: ManualFraudCheckPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualFraudCheckPlan[] {
    return this.inner.list();
  }
}

export function newCachedManualFraudCheckPlanStore(inner: ManualFraudCheckPlanStore, ttl: number, clockValue: clock.Clock): ManualFraudCheckPlanStore {
  return new CachedManualFraudCheckPlanStore(
    inner,
    cache.newTtlCache<ManualFraudCheckPlan>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual fraud check plans. Empty fields match all. */
export class ManualFraudCheckPlanQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualFraudCheckPlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualFraudCheckPlan[]): ManualFraudCheckPlan[] {
    const matched = collections.filter(items, (candidate: ManualFraudCheckPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualFraudCheckPlans(store: ManualFraudCheckPlanStore, query: ManualFraudCheckPlanQuery): ManualFraudCheckPlan[] {
  return query.apply(store.list());
}

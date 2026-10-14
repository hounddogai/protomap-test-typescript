import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySenderPlan } from "./primary-sender-plan.js";

/** Keeps primary sender plans by code. */
export interface PrimarySenderPlanStore {
  find(code: string): PrimarySenderPlan | undefined;
  save(item: PrimarySenderPlan): void;
  remove(code: string): boolean;
  list(): PrimarySenderPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySenderPlanStore implements PrimarySenderPlanStore {
  items: Map<string, PrimarySenderPlan>;
  order: string[];

  constructor(items: Map<string, PrimarySenderPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySenderPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySenderPlan): void {
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

  list(): PrimarySenderPlan[] {
    const out: PrimarySenderPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySenderPlanStore(): PrimarySenderPlanStore {
  return new MemoryPrimarySenderPlanStore(new Map<string, PrimarySenderPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySenderPlanStore implements PrimarySenderPlanStore {
  inner: PrimarySenderPlanStore;
  cache: cache.TtlCache<PrimarySenderPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySenderPlanStore,
    cacheValue: cache.TtlCache<PrimarySenderPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySenderPlan | undefined {
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

  save(item: PrimarySenderPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySenderPlan[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySenderPlanStore(inner: PrimarySenderPlanStore, ttl: number, clockValue: clock.Clock): PrimarySenderPlanStore {
  return new CachedPrimarySenderPlanStore(inner, cache.newTtlCache<PrimarySenderPlan>(128, ttl, clockValue), 0, 0);
}

/** Selects primary sender plans. Empty fields match all. */
export class PrimarySenderPlanQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySenderPlan): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySenderPlan[]): PrimarySenderPlan[] {
    const matched = collections.filter(items, (candidate: PrimarySenderPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySenderPlans(store: PrimarySenderPlanStore, query: PrimarySenderPlanQuery): PrimarySenderPlan[] {
  return query.apply(store.list());
}

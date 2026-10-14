import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInPlan } from "./double-opt-in-plan.js";

/** Keeps double opt in plans by code. */
export interface DoubleOptInPlanStore {
  find(code: string): DoubleOptInPlan | undefined;
  save(item: DoubleOptInPlan): void;
  remove(code: string): boolean;
  list(): DoubleOptInPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInPlanStore implements DoubleOptInPlanStore {
  items: Map<string, DoubleOptInPlan>;
  order: string[];

  constructor(items: Map<string, DoubleOptInPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInPlan): void {
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

  list(): DoubleOptInPlan[] {
    const out: DoubleOptInPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInPlanStore(): DoubleOptInPlanStore {
  return new MemoryDoubleOptInPlanStore(new Map<string, DoubleOptInPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInPlanStore implements DoubleOptInPlanStore {
  inner: DoubleOptInPlanStore;
  cache: cache.TtlCache<DoubleOptInPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInPlanStore,
    cacheValue: cache.TtlCache<DoubleOptInPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInPlan | undefined {
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

  save(item: DoubleOptInPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInPlan[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInPlanStore(inner: DoubleOptInPlanStore, ttl: number, clockValue: clock.Clock): DoubleOptInPlanStore {
  return new CachedDoubleOptInPlanStore(inner, cache.newTtlCache<DoubleOptInPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects double opt in plans. Empty fields match all. */
export class DoubleOptInPlanQuery {
  utmSource: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMaximum: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInPlan): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInPlan[]): DoubleOptInPlan[] {
    const matched = collections.filter(items, (candidate: DoubleOptInPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInPlans(store: DoubleOptInPlanStore, query: DoubleOptInPlanQuery): DoubleOptInPlan[] {
  return query.apply(store.list());
}

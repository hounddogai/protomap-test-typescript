import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPayoutPlan } from "./lenient-payout-plan.js";

/** Keeps lenient payout plans by code. */
export interface LenientPayoutPlanStore {
  find(code: string): LenientPayoutPlan | undefined;
  save(item: LenientPayoutPlan): void;
  remove(code: string): boolean;
  list(): LenientPayoutPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPayoutPlanStore implements LenientPayoutPlanStore {
  items: Map<string, LenientPayoutPlan>;
  order: string[];

  constructor(items: Map<string, LenientPayoutPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPayoutPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPayoutPlan): void {
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

  list(): LenientPayoutPlan[] {
    const out: LenientPayoutPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPayoutPlanStore(): LenientPayoutPlanStore {
  return new MemoryLenientPayoutPlanStore(new Map<string, LenientPayoutPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPayoutPlanStore implements LenientPayoutPlanStore {
  inner: LenientPayoutPlanStore;
  cache: cache.TtlCache<LenientPayoutPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPayoutPlanStore,
    cacheValue: cache.TtlCache<LenientPayoutPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPayoutPlan | undefined {
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

  save(item: LenientPayoutPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPayoutPlan[] {
    return this.inner.list();
  }
}

export function newCachedLenientPayoutPlanStore(inner: LenientPayoutPlanStore, ttl: number, clockValue: clock.Clock): LenientPayoutPlanStore {
  return new CachedLenientPayoutPlanStore(inner, cache.newTtlCache<LenientPayoutPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient payout plans. Empty fields match all. */
export class LenientPayoutPlanQuery {
  unit: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRatio: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPayoutPlan): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPayoutPlan[]): LenientPayoutPlan[] {
    const matched = collections.filter(items, (candidate: LenientPayoutPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPayoutPlans(store: LenientPayoutPlanStore, query: LenientPayoutPlanQuery): LenientPayoutPlan[] {
  return query.apply(store.list());
}

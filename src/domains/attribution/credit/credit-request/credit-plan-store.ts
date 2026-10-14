import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditPlan } from "./credit-plan.js";

/** Keeps credit plans by code. */
export interface CreditPlanStore {
  find(code: string): CreditPlan | undefined;
  save(item: CreditPlan): void;
  remove(code: string): boolean;
  list(): CreditPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditPlanStore implements CreditPlanStore {
  items: Map<string, CreditPlan>;
  order: string[];

  constructor(items: Map<string, CreditPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditPlan): void {
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

  list(): CreditPlan[] {
    const out: CreditPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditPlanStore(): CreditPlanStore {
  return new MemoryCreditPlanStore(new Map<string, CreditPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditPlanStore implements CreditPlanStore {
  inner: CreditPlanStore;
  cache: cache.TtlCache<CreditPlan>;
  hits: number;
  misses: number;

  constructor(inner: CreditPlanStore, cacheValue: cache.TtlCache<CreditPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditPlan | undefined {
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

  save(item: CreditPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditPlan[] {
    return this.inner.list();
  }
}

export function newCachedCreditPlanStore(inner: CreditPlanStore, ttl: number, clockValue: clock.Clock): CreditPlanStore {
  return new CachedCreditPlanStore(inner, cache.newTtlCache<CreditPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects credit plans. Empty fields match all. */
export class CreditPlanQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditPlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditPlan[]): CreditPlan[] {
    const matched = collections.filter(items, (candidate: CreditPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditPlans(store: CreditPlanStore, query: CreditPlanQuery): CreditPlan[] {
  return query.apply(store.list());
}

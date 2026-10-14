import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSubscriptionPlan } from "./default-subscription-plan.js";

/** Keeps default subscription plans by code. */
export interface DefaultSubscriptionPlanStore {
  find(code: string): DefaultSubscriptionPlan | undefined;
  save(item: DefaultSubscriptionPlan): void;
  remove(code: string): boolean;
  list(): DefaultSubscriptionPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSubscriptionPlanStore implements DefaultSubscriptionPlanStore {
  items: Map<string, DefaultSubscriptionPlan>;
  order: string[];

  constructor(items: Map<string, DefaultSubscriptionPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSubscriptionPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSubscriptionPlan): void {
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

  list(): DefaultSubscriptionPlan[] {
    const out: DefaultSubscriptionPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSubscriptionPlanStore(): DefaultSubscriptionPlanStore {
  return new MemoryDefaultSubscriptionPlanStore(new Map<string, DefaultSubscriptionPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSubscriptionPlanStore implements DefaultSubscriptionPlanStore {
  inner: DefaultSubscriptionPlanStore;
  cache: cache.TtlCache<DefaultSubscriptionPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSubscriptionPlanStore,
    cacheValue: cache.TtlCache<DefaultSubscriptionPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSubscriptionPlan | undefined {
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

  save(item: DefaultSubscriptionPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSubscriptionPlan[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSubscriptionPlanStore(inner: DefaultSubscriptionPlanStore, ttl: number, clockValue: clock.Clock): DefaultSubscriptionPlanStore {
  return new CachedDefaultSubscriptionPlanStore(
    inner,
    cache.newTtlCache<DefaultSubscriptionPlan>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default subscription plans. Empty fields match all. */
export class DefaultSubscriptionPlanQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSubscriptionPlan): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSubscriptionPlan[]): DefaultSubscriptionPlan[] {
    const matched = collections.filter(items, (candidate: DefaultSubscriptionPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSubscriptionPlans(store: DefaultSubscriptionPlanStore, query: DefaultSubscriptionPlanQuery): DefaultSubscriptionPlan[] {
  return query.apply(store.list());
}

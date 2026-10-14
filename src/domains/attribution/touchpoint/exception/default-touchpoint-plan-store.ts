import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultTouchpointPlan } from "./default-touchpoint-plan.js";

/** Keeps default touchpoint plans by code. */
export interface DefaultTouchpointPlanStore {
  find(code: string): DefaultTouchpointPlan | undefined;
  save(item: DefaultTouchpointPlan): void;
  remove(code: string): boolean;
  list(): DefaultTouchpointPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultTouchpointPlanStore implements DefaultTouchpointPlanStore {
  items: Map<string, DefaultTouchpointPlan>;
  order: string[];

  constructor(items: Map<string, DefaultTouchpointPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultTouchpointPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultTouchpointPlan): void {
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

  list(): DefaultTouchpointPlan[] {
    const out: DefaultTouchpointPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultTouchpointPlanStore(): DefaultTouchpointPlanStore {
  return new MemoryDefaultTouchpointPlanStore(new Map<string, DefaultTouchpointPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultTouchpointPlanStore implements DefaultTouchpointPlanStore {
  inner: DefaultTouchpointPlanStore;
  cache: cache.TtlCache<DefaultTouchpointPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultTouchpointPlanStore,
    cacheValue: cache.TtlCache<DefaultTouchpointPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultTouchpointPlan | undefined {
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

  save(item: DefaultTouchpointPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultTouchpointPlan[] {
    return this.inner.list();
  }
}

export function newCachedDefaultTouchpointPlanStore(inner: DefaultTouchpointPlanStore, ttl: number, clockValue: clock.Clock): DefaultTouchpointPlanStore {
  return new CachedDefaultTouchpointPlanStore(
    inner,
    cache.newTtlCache<DefaultTouchpointPlan>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default touchpoint plans. Empty fields match all. */
export class DefaultTouchpointPlanQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultTouchpointPlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultTouchpointPlan[]): DefaultTouchpointPlan[] {
    const matched = collections.filter(items, (candidate: DefaultTouchpointPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultTouchpointPlans(store: DefaultTouchpointPlanStore, query: DefaultTouchpointPlanQuery): DefaultTouchpointPlan[] {
  return query.apply(store.list());
}

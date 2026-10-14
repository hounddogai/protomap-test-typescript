import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowPlan } from "./window-plan.js";

/** Keeps window plans by code. */
export interface WindowPlanStore {
  find(code: string): WindowPlan | undefined;
  save(item: WindowPlan): void;
  remove(code: string): boolean;
  list(): WindowPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowPlanStore implements WindowPlanStore {
  items: Map<string, WindowPlan>;
  order: string[];

  constructor(items: Map<string, WindowPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowPlan): void {
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

  list(): WindowPlan[] {
    const out: WindowPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowPlanStore(): WindowPlanStore {
  return new MemoryWindowPlanStore(new Map<string, WindowPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowPlanStore implements WindowPlanStore {
  inner: WindowPlanStore;
  cache: cache.TtlCache<WindowPlan>;
  hits: number;
  misses: number;

  constructor(inner: WindowPlanStore, cacheValue: cache.TtlCache<WindowPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowPlan | undefined {
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

  save(item: WindowPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowPlan[] {
    return this.inner.list();
  }
}

export function newCachedWindowPlanStore(inner: WindowPlanStore, ttl: number, clockValue: clock.Clock): WindowPlanStore {
  return new CachedWindowPlanStore(inner, cache.newTtlCache<WindowPlan>(128, ttl, clockValue), 0, 0);
}

/** Selects window plans. Empty fields match all. */
export class WindowPlanQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowPlan): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowPlan[]): WindowPlan[] {
    const matched = collections.filter(items, (candidate: WindowPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowPlans(store: WindowPlanStore, query: WindowPlanQuery): WindowPlan[] {
  return query.apply(store.list());
}

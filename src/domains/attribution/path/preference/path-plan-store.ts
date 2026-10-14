import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathPlan } from "./path-plan.js";

/** Keeps path plans by code. */
export interface PathPlanStore {
  find(code: string): PathPlan | undefined;
  save(item: PathPlan): void;
  remove(code: string): boolean;
  list(): PathPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathPlanStore implements PathPlanStore {
  items: Map<string, PathPlan>;
  order: string[];

  constructor(items: Map<string, PathPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathPlan): void {
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

  list(): PathPlan[] {
    const out: PathPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathPlanStore(): PathPlanStore {
  return new MemoryPathPlanStore(new Map<string, PathPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathPlanStore implements PathPlanStore {
  inner: PathPlanStore;
  cache: cache.TtlCache<PathPlan>;
  hits: number;
  misses: number;

  constructor(inner: PathPlanStore, cacheValue: cache.TtlCache<PathPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathPlan | undefined {
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

  save(item: PathPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathPlan[] {
    return this.inner.list();
  }
}

export function newCachedPathPlanStore(inner: PathPlanStore, ttl: number, clockValue: clock.Clock): PathPlanStore {
  return new CachedPathPlanStore(inner, cache.newTtlCache<PathPlan>(1024, ttl, clockValue), 0, 0);
}

/** Selects path plans. Empty fields match all. */
export class PathPlanQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathPlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathPlan[]): PathPlan[] {
    const matched = collections.filter(items, (candidate: PathPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathPlans(store: PathPlanStore, query: PathPlanQuery): PathPlan[] {
  return query.apply(store.list());
}

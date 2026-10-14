import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWarmupPlan } from "./scheduled-warmup-plan.js";

/** Keeps scheduled warmup plans by code. */
export interface ScheduledWarmupPlanStore {
  find(code: string): ScheduledWarmupPlan | undefined;
  save(item: ScheduledWarmupPlan): void;
  remove(code: string): boolean;
  list(): ScheduledWarmupPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWarmupPlanStore implements ScheduledWarmupPlanStore {
  items: Map<string, ScheduledWarmupPlan>;
  order: string[];

  constructor(items: Map<string, ScheduledWarmupPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWarmupPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWarmupPlan): void {
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

  list(): ScheduledWarmupPlan[] {
    const out: ScheduledWarmupPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWarmupPlanStore(): ScheduledWarmupPlanStore {
  return new MemoryScheduledWarmupPlanStore(new Map<string, ScheduledWarmupPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWarmupPlanStore implements ScheduledWarmupPlanStore {
  inner: ScheduledWarmupPlanStore;
  cache: cache.TtlCache<ScheduledWarmupPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWarmupPlanStore,
    cacheValue: cache.TtlCache<ScheduledWarmupPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWarmupPlan | undefined {
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

  save(item: ScheduledWarmupPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWarmupPlan[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWarmupPlanStore(inner: ScheduledWarmupPlanStore, ttl: number, clockValue: clock.Clock): ScheduledWarmupPlanStore {
  return new CachedScheduledWarmupPlanStore(inner, cache.newTtlCache<ScheduledWarmupPlan>(512, ttl, clockValue), 0, 0);
}

/** Selects scheduled warmup plans. Empty fields match all. */
export class ScheduledWarmupPlanQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWarmupPlan): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWarmupPlan[]): ScheduledWarmupPlan[] {
    const matched = collections.filter(items, (candidate: ScheduledWarmupPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWarmupPlans(store: ScheduledWarmupPlanStore, query: ScheduledWarmupPlanQuery): ScheduledWarmupPlan[] {
  return query.apply(store.list());
}

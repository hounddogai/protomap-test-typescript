import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingInsightPlan } from "./pending-insight-plan.js";

/** Keeps pending insight plans by code. */
export interface PendingInsightPlanStore {
  find(code: string): PendingInsightPlan | undefined;
  save(item: PendingInsightPlan): void;
  remove(code: string): boolean;
  list(): PendingInsightPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingInsightPlanStore implements PendingInsightPlanStore {
  items: Map<string, PendingInsightPlan>;
  order: string[];

  constructor(items: Map<string, PendingInsightPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingInsightPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingInsightPlan): void {
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

  list(): PendingInsightPlan[] {
    const out: PendingInsightPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingInsightPlanStore(): PendingInsightPlanStore {
  return new MemoryPendingInsightPlanStore(new Map<string, PendingInsightPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingInsightPlanStore implements PendingInsightPlanStore {
  inner: PendingInsightPlanStore;
  cache: cache.TtlCache<PendingInsightPlan>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingInsightPlanStore,
    cacheValue: cache.TtlCache<PendingInsightPlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingInsightPlan | undefined {
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

  save(item: PendingInsightPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingInsightPlan[] {
    return this.inner.list();
  }
}

export function newCachedPendingInsightPlanStore(inner: PendingInsightPlanStore, ttl: number, clockValue: clock.Clock): PendingInsightPlanStore {
  return new CachedPendingInsightPlanStore(inner, cache.newTtlCache<PendingInsightPlan>(64, ttl, clockValue), 0, 0);
}

/** Selects pending insight plans. Empty fields match all. */
export class PendingInsightPlanQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingInsightPlan): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingInsightPlan[]): PendingInsightPlan[] {
    const matched = collections.filter(items, (candidate: PendingInsightPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingInsightPlans(store: PendingInsightPlanStore, query: PendingInsightPlanQuery): PendingInsightPlan[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingPlan } from "./pacing-plan.js";

/** Keeps pacing plans by code. */
export interface PacingPlanStore {
  find(code: string): PacingPlan | undefined;
  save(item: PacingPlan): void;
  remove(code: string): boolean;
  list(): PacingPlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingPlanStore implements PacingPlanStore {
  items: Map<string, PacingPlan>;
  order: string[];

  constructor(items: Map<string, PacingPlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingPlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingPlan): void {
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

  list(): PacingPlan[] {
    const out: PacingPlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingPlanStore(): PacingPlanStore {
  return new MemoryPacingPlanStore(new Map<string, PacingPlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingPlanStore implements PacingPlanStore {
  inner: PacingPlanStore;
  cache: cache.TtlCache<PacingPlan>;
  hits: number;
  misses: number;

  constructor(inner: PacingPlanStore, cacheValue: cache.TtlCache<PacingPlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingPlan | undefined {
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

  save(item: PacingPlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingPlan[] {
    return this.inner.list();
  }
}

export function newCachedPacingPlanStore(inner: PacingPlanStore, ttl: number, clockValue: clock.Clock): PacingPlanStore {
  return new CachedPacingPlanStore(inner, cache.newTtlCache<PacingPlan>(256, ttl, clockValue), 0, 0);
}

/** Selects pacing plans. Empty fields match all. */
export class PacingPlanQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingPlan): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingPlan[]): PacingPlan[] {
    const matched = collections.filter(items, (candidate: PacingPlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingPlans(store: PacingPlanStore, query: PacingPlanQuery): PacingPlan[] {
  return query.apply(store.list());
}

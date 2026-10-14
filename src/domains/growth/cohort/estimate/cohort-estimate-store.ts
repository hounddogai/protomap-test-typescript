import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortEstimate } from "./cohort-estimate.js";

/** Keeps cohort estimates by code. */
export interface CohortEstimateStore {
  find(code: string): CohortEstimate | undefined;
  save(item: CohortEstimate): void;
  remove(code: string): boolean;
  list(): CohortEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortEstimateStore implements CohortEstimateStore {
  items: Map<string, CohortEstimate>;
  order: string[];

  constructor(items: Map<string, CohortEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortEstimate): void {
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

  list(): CohortEstimate[] {
    const out: CohortEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortEstimateStore(): CohortEstimateStore {
  return new MemoryCohortEstimateStore(new Map<string, CohortEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortEstimateStore implements CohortEstimateStore {
  inner: CohortEstimateStore;
  cache: cache.TtlCache<CohortEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortEstimateStore,
    cacheValue: cache.TtlCache<CohortEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortEstimate | undefined {
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

  save(item: CohortEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortEstimate[] {
    return this.inner.list();
  }
}

export function newCachedCohortEstimateStore(inner: CohortEstimateStore, ttl: number, clockValue: clock.Clock): CohortEstimateStore {
  return new CachedCohortEstimateStore(inner, cache.newTtlCache<CohortEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects cohort estimates. Empty fields match all. */
export class CohortEstimateQuery {
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

  matches(item: CohortEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortEstimate[]): CohortEstimate[] {
    const matched = collections.filter(items, (candidate: CohortEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortEstimates(store: CohortEstimateStore, query: CohortEstimateQuery): CohortEstimate[] {
  return query.apply(store.list());
}

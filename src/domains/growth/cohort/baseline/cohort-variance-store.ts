import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortVariance } from "./cohort-variance.js";

/** Keeps cohort variances by code. */
export interface CohortVarianceStore {
  find(code: string): CohortVariance | undefined;
  save(item: CohortVariance): void;
  remove(code: string): boolean;
  list(): CohortVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortVarianceStore implements CohortVarianceStore {
  items: Map<string, CohortVariance>;
  order: string[];

  constructor(items: Map<string, CohortVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortVariance): void {
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

  list(): CohortVariance[] {
    const out: CohortVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortVarianceStore(): CohortVarianceStore {
  return new MemoryCohortVarianceStore(new Map<string, CohortVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortVarianceStore implements CohortVarianceStore {
  inner: CohortVarianceStore;
  cache: cache.TtlCache<CohortVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortVarianceStore,
    cacheValue: cache.TtlCache<CohortVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortVariance | undefined {
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

  save(item: CohortVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortVariance[] {
    return this.inner.list();
  }
}

export function newCachedCohortVarianceStore(inner: CohortVarianceStore, ttl: number, clockValue: clock.Clock): CohortVarianceStore {
  return new CachedCohortVarianceStore(inner, cache.newTtlCache<CohortVariance>(256, ttl, clockValue), 0, 0);
}

/** Selects cohort variances. Empty fields match all. */
export class CohortVarianceQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortVariance): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortVariance[]): CohortVariance[] {
    const matched = collections.filter(items, (candidate: CohortVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortVariances(store: CohortVarianceStore, query: CohortVarianceQuery): CohortVariance[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingStepVariance } from "./rolling-step-variance.js";

/** Keeps rolling step variances by code. */
export interface RollingStepVarianceStore {
  find(code: string): RollingStepVariance | undefined;
  save(item: RollingStepVariance): void;
  remove(code: string): boolean;
  list(): RollingStepVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingStepVarianceStore implements RollingStepVarianceStore {
  items: Map<string, RollingStepVariance>;
  order: string[];

  constructor(items: Map<string, RollingStepVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingStepVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingStepVariance): void {
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

  list(): RollingStepVariance[] {
    const out: RollingStepVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingStepVarianceStore(): RollingStepVarianceStore {
  return new MemoryRollingStepVarianceStore(new Map<string, RollingStepVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingStepVarianceStore implements RollingStepVarianceStore {
  inner: RollingStepVarianceStore;
  cache: cache.TtlCache<RollingStepVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingStepVarianceStore,
    cacheValue: cache.TtlCache<RollingStepVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingStepVariance | undefined {
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

  save(item: RollingStepVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingStepVariance[] {
    return this.inner.list();
  }
}

export function newCachedRollingStepVarianceStore(inner: RollingStepVarianceStore, ttl: number, clockValue: clock.Clock): RollingStepVarianceStore {
  return new CachedRollingStepVarianceStore(inner, cache.newTtlCache<RollingStepVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects rolling step variances. Empty fields match all. */
export class RollingStepVarianceQuery {
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

  matches(item: RollingStepVariance): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingStepVariance[]): RollingStepVariance[] {
    const matched = collections.filter(items, (candidate: RollingStepVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingStepVariances(store: RollingStepVarianceStore, query: RollingStepVarianceQuery): RollingStepVariance[] {
  return query.apply(store.list());
}

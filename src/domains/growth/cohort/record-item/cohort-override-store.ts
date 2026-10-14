import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortOverride } from "./cohort-override.js";

/** Keeps cohort overrides by code. */
export interface CohortOverrideStore {
  find(code: string): CohortOverride | undefined;
  save(item: CohortOverride): void;
  remove(code: string): boolean;
  list(): CohortOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortOverrideStore implements CohortOverrideStore {
  items: Map<string, CohortOverride>;
  order: string[];

  constructor(items: Map<string, CohortOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortOverride): void {
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

  list(): CohortOverride[] {
    const out: CohortOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortOverrideStore(): CohortOverrideStore {
  return new MemoryCohortOverrideStore(new Map<string, CohortOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortOverrideStore implements CohortOverrideStore {
  inner: CohortOverrideStore;
  cache: cache.TtlCache<CohortOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortOverrideStore,
    cacheValue: cache.TtlCache<CohortOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortOverride | undefined {
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

  save(item: CohortOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortOverride[] {
    return this.inner.list();
  }
}

export function newCachedCohortOverrideStore(inner: CohortOverrideStore, ttl: number, clockValue: clock.Clock): CohortOverrideStore {
  return new CachedCohortOverrideStore(inner, cache.newTtlCache<CohortOverride>(1024, ttl, clockValue), 0, 0);
}

/** Selects cohort overrides. Empty fields match all. */
export class CohortOverrideQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortOverride): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortOverride[]): CohortOverride[] {
    const matched = collections.filter(items, (candidate: CohortOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortOverrides(store: CohortOverrideStore, query: CohortOverrideQuery): CohortOverride[] {
  return query.apply(store.list());
}

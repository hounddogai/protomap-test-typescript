import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortRollup } from "./cohort-rollup.js";

/** Keeps cohort rollups by code. */
export interface CohortRollupStore {
  find(code: string): CohortRollup | undefined;
  save(item: CohortRollup): void;
  remove(code: string): boolean;
  list(): CohortRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortRollupStore implements CohortRollupStore {
  items: Map<string, CohortRollup>;
  order: string[];

  constructor(items: Map<string, CohortRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortRollup): void {
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

  list(): CohortRollup[] {
    const out: CohortRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortRollupStore(): CohortRollupStore {
  return new MemoryCohortRollupStore(new Map<string, CohortRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortRollupStore implements CohortRollupStore {
  inner: CohortRollupStore;
  cache: cache.TtlCache<CohortRollup>;
  hits: number;
  misses: number;

  constructor(inner: CohortRollupStore, cacheValue: cache.TtlCache<CohortRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortRollup | undefined {
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

  save(item: CohortRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortRollup[] {
    return this.inner.list();
  }
}

export function newCachedCohortRollupStore(inner: CohortRollupStore, ttl: number, clockValue: clock.Clock): CohortRollupStore {
  return new CachedCohortRollupStore(inner, cache.newTtlCache<CohortRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects cohort rollups. Empty fields match all. */
export class CohortRollupQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortRollup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortRollup[]): CohortRollup[] {
    const matched = collections.filter(items, (candidate: CohortRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortRollups(store: CohortRollupStore, query: CohortRollupQuery): CohortRollup[] {
  return query.apply(store.list());
}

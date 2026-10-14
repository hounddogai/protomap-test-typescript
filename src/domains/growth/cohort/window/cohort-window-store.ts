import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortWindow } from "./cohort-window.js";

/** Keeps cohort windows by code. */
export interface CohortWindowStore {
  find(code: string): CohortWindow | undefined;
  save(item: CohortWindow): void;
  remove(code: string): boolean;
  list(): CohortWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortWindowStore implements CohortWindowStore {
  items: Map<string, CohortWindow>;
  order: string[];

  constructor(items: Map<string, CohortWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortWindow): void {
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

  list(): CohortWindow[] {
    const out: CohortWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortWindowStore(): CohortWindowStore {
  return new MemoryCohortWindowStore(new Map<string, CohortWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortWindowStore implements CohortWindowStore {
  inner: CohortWindowStore;
  cache: cache.TtlCache<CohortWindow>;
  hits: number;
  misses: number;

  constructor(inner: CohortWindowStore, cacheValue: cache.TtlCache<CohortWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortWindow | undefined {
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

  save(item: CohortWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortWindow[] {
    return this.inner.list();
  }
}

export function newCachedCohortWindowStore(inner: CohortWindowStore, ttl: number, clockValue: clock.Clock): CohortWindowStore {
  return new CachedCohortWindowStore(inner, cache.newTtlCache<CohortWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects cohort windows. Empty fields match all. */
export class CohortWindowQuery {
  country: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCost: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortWindow): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortWindow[]): CohortWindow[] {
    const matched = collections.filter(items, (candidate: CohortWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortWindows(store: CohortWindowStore, query: CohortWindowQuery): CohortWindow[] {
  return query.apply(store.list());
}

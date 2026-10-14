import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortCycle } from "./cohort-cycle.js";

/** Keeps cohort cycles by code. */
export interface CohortCycleStore {
  find(code: string): CohortCycle | undefined;
  save(item: CohortCycle): void;
  remove(code: string): boolean;
  list(): CohortCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortCycleStore implements CohortCycleStore {
  items: Map<string, CohortCycle>;
  order: string[];

  constructor(items: Map<string, CohortCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortCycle): void {
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

  list(): CohortCycle[] {
    const out: CohortCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortCycleStore(): CohortCycleStore {
  return new MemoryCohortCycleStore(new Map<string, CohortCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortCycleStore implements CohortCycleStore {
  inner: CohortCycleStore;
  cache: cache.TtlCache<CohortCycle>;
  hits: number;
  misses: number;

  constructor(inner: CohortCycleStore, cacheValue: cache.TtlCache<CohortCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortCycle | undefined {
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

  save(item: CohortCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortCycle[] {
    return this.inner.list();
  }
}

export function newCachedCohortCycleStore(inner: CohortCycleStore, ttl: number, clockValue: clock.Clock): CohortCycleStore {
  return new CachedCohortCycleStore(inner, cache.newTtlCache<CohortCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects cohort cycles. Empty fields match all. */
export class CohortCycleQuery {
  name: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWindowDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortCycle[]): CohortCycle[] {
    const matched = collections.filter(items, (candidate: CohortCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortCycles(store: CohortCycleStore, query: CohortCycleQuery): CohortCycle[] {
  return query.apply(store.list());
}

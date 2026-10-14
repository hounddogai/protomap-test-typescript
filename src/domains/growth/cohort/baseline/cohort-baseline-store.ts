import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortBaseline } from "./cohort-baseline.js";

/** Keeps cohort baselines by code. */
export interface CohortBaselineStore {
  find(code: string): CohortBaseline | undefined;
  save(item: CohortBaseline): void;
  remove(code: string): boolean;
  list(): CohortBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortBaselineStore implements CohortBaselineStore {
  items: Map<string, CohortBaseline>;
  order: string[];

  constructor(items: Map<string, CohortBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortBaseline): void {
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

  list(): CohortBaseline[] {
    const out: CohortBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortBaselineStore(): CohortBaselineStore {
  return new MemoryCohortBaselineStore(new Map<string, CohortBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortBaselineStore implements CohortBaselineStore {
  inner: CohortBaselineStore;
  cache: cache.TtlCache<CohortBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortBaselineStore,
    cacheValue: cache.TtlCache<CohortBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortBaseline | undefined {
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

  save(item: CohortBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortBaseline[] {
    return this.inner.list();
  }
}

export function newCachedCohortBaselineStore(inner: CohortBaselineStore, ttl: number, clockValue: clock.Clock): CohortBaselineStore {
  return new CachedCohortBaselineStore(inner, cache.newTtlCache<CohortBaseline>(1024, ttl, clockValue), 0, 0);
}

/** Selects cohort baselines. Empty fields match all. */
export class CohortBaselineQuery {
  region: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minFloorValue: number, statuses: string[], limit: number) {
    this.region = region;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortBaseline): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortBaseline[]): CohortBaseline[] {
    const matched = collections.filter(items, (candidate: CohortBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortBaselines(store: CohortBaselineStore, query: CohortBaselineQuery): CohortBaseline[] {
  return query.apply(store.list());
}

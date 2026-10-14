import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortAdjustment } from "./cohort-adjustment.js";

/** Keeps cohort adjustments by code. */
export interface CohortAdjustmentStore {
  find(code: string): CohortAdjustment | undefined;
  save(item: CohortAdjustment): void;
  remove(code: string): boolean;
  list(): CohortAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortAdjustmentStore implements CohortAdjustmentStore {
  items: Map<string, CohortAdjustment>;
  order: string[];

  constructor(items: Map<string, CohortAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortAdjustment): void {
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

  list(): CohortAdjustment[] {
    const out: CohortAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortAdjustmentStore(): CohortAdjustmentStore {
  return new MemoryCohortAdjustmentStore(new Map<string, CohortAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortAdjustmentStore implements CohortAdjustmentStore {
  inner: CohortAdjustmentStore;
  cache: cache.TtlCache<CohortAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortAdjustmentStore,
    cacheValue: cache.TtlCache<CohortAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortAdjustment | undefined {
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

  save(item: CohortAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedCohortAdjustmentStore(inner: CohortAdjustmentStore, ttl: number, clockValue: clock.Clock): CohortAdjustmentStore {
  return new CachedCohortAdjustmentStore(inner, cache.newTtlCache<CohortAdjustment>(256, ttl, clockValue), 0, 0);
}

/** Selects cohort adjustments. Empty fields match all. */
export class CohortAdjustmentQuery {
  country: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minOpenRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortAdjustment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortAdjustment[]): CohortAdjustment[] {
    const matched = collections.filter(items, (candidate: CohortAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortAdjustments(store: CohortAdjustmentStore, query: CohortAdjustmentQuery): CohortAdjustment[] {
  return query.apply(store.list());
}

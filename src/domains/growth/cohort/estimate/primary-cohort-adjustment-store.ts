import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryCohortAdjustment } from "./primary-cohort-adjustment.js";

/** Keeps primary cohort adjustments by code. */
export interface PrimaryCohortAdjustmentStore {
  find(code: string): PrimaryCohortAdjustment | undefined;
  save(item: PrimaryCohortAdjustment): void;
  remove(code: string): boolean;
  list(): PrimaryCohortAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryCohortAdjustmentStore implements PrimaryCohortAdjustmentStore {
  items: Map<string, PrimaryCohortAdjustment>;
  order: string[];

  constructor(items: Map<string, PrimaryCohortAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryCohortAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryCohortAdjustment): void {
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

  list(): PrimaryCohortAdjustment[] {
    const out: PrimaryCohortAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryCohortAdjustmentStore(): PrimaryCohortAdjustmentStore {
  return new MemoryPrimaryCohortAdjustmentStore(new Map<string, PrimaryCohortAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryCohortAdjustmentStore implements PrimaryCohortAdjustmentStore {
  inner: PrimaryCohortAdjustmentStore;
  cache: cache.TtlCache<PrimaryCohortAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryCohortAdjustmentStore,
    cacheValue: cache.TtlCache<PrimaryCohortAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryCohortAdjustment | undefined {
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

  save(item: PrimaryCohortAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryCohortAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryCohortAdjustmentStore(inner: PrimaryCohortAdjustmentStore, ttl: number, clockValue: clock.Clock): PrimaryCohortAdjustmentStore {
  return new CachedPrimaryCohortAdjustmentStore(
    inner,
    cache.newTtlCache<PrimaryCohortAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary cohort adjustments. Empty fields match all. */
export class PrimaryCohortAdjustmentQuery {
  region: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minWindowDays: number, statuses: string[], limit: number) {
    this.region = region;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryCohortAdjustment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryCohortAdjustment[]): PrimaryCohortAdjustment[] {
    const matched = collections.filter(items, (candidate: PrimaryCohortAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryCohortAdjustments(store: PrimaryCohortAdjustmentStore, query: PrimaryCohortAdjustmentQuery): PrimaryCohortAdjustment[] {
  return query.apply(store.list());
}

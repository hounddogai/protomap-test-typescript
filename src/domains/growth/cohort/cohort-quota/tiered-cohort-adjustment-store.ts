import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredCohortAdjustment } from "./tiered-cohort-adjustment.js";

/** Keeps tiered cohort adjustments by code. */
export interface TieredCohortAdjustmentStore {
  find(code: string): TieredCohortAdjustment | undefined;
  save(item: TieredCohortAdjustment): void;
  remove(code: string): boolean;
  list(): TieredCohortAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredCohortAdjustmentStore implements TieredCohortAdjustmentStore {
  items: Map<string, TieredCohortAdjustment>;
  order: string[];

  constructor(items: Map<string, TieredCohortAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredCohortAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredCohortAdjustment): void {
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

  list(): TieredCohortAdjustment[] {
    const out: TieredCohortAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredCohortAdjustmentStore(): TieredCohortAdjustmentStore {
  return new MemoryTieredCohortAdjustmentStore(new Map<string, TieredCohortAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredCohortAdjustmentStore implements TieredCohortAdjustmentStore {
  inner: TieredCohortAdjustmentStore;
  cache: cache.TtlCache<TieredCohortAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredCohortAdjustmentStore,
    cacheValue: cache.TtlCache<TieredCohortAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredCohortAdjustment | undefined {
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

  save(item: TieredCohortAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredCohortAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedTieredCohortAdjustmentStore(inner: TieredCohortAdjustmentStore, ttl: number, clockValue: clock.Clock): TieredCohortAdjustmentStore {
  return new CachedTieredCohortAdjustmentStore(
    inner,
    cache.newTtlCache<TieredCohortAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered cohort adjustments. Empty fields match all. */
export class TieredCohortAdjustmentQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredCohortAdjustment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredCohortAdjustment[]): TieredCohortAdjustment[] {
    const matched = collections.filter(items, (candidate: TieredCohortAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredCohortAdjustments(store: TieredCohortAdjustmentStore, query: TieredCohortAdjustmentQuery): TieredCohortAdjustment[] {
  return query.apply(store.list());
}

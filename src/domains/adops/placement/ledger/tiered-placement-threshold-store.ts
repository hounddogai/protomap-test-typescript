import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPlacementThreshold } from "./tiered-placement-threshold.js";

/** Keeps tiered placement thresholds by code. */
export interface TieredPlacementThresholdStore {
  find(code: string): TieredPlacementThreshold | undefined;
  save(item: TieredPlacementThreshold): void;
  remove(code: string): boolean;
  list(): TieredPlacementThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPlacementThresholdStore implements TieredPlacementThresholdStore {
  items: Map<string, TieredPlacementThreshold>;
  order: string[];

  constructor(items: Map<string, TieredPlacementThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPlacementThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPlacementThreshold): void {
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

  list(): TieredPlacementThreshold[] {
    const out: TieredPlacementThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPlacementThresholdStore(): TieredPlacementThresholdStore {
  return new MemoryTieredPlacementThresholdStore(new Map<string, TieredPlacementThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPlacementThresholdStore implements TieredPlacementThresholdStore {
  inner: TieredPlacementThresholdStore;
  cache: cache.TtlCache<TieredPlacementThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPlacementThresholdStore,
    cacheValue: cache.TtlCache<TieredPlacementThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPlacementThreshold | undefined {
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

  save(item: TieredPlacementThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPlacementThreshold[] {
    return this.inner.list();
  }
}

export function newCachedTieredPlacementThresholdStore(inner: TieredPlacementThresholdStore, ttl: number, clockValue: clock.Clock): TieredPlacementThresholdStore {
  return new CachedTieredPlacementThresholdStore(
    inner,
    cache.newTtlCache<TieredPlacementThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered placement thresholds. Empty fields match all. */
export class TieredPlacementThresholdQuery {
  utmSource: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAmount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPlacementThreshold): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPlacementThreshold[]): TieredPlacementThreshold[] {
    const matched = collections.filter(items, (candidate: TieredPlacementThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPlacementThresholds(store: TieredPlacementThresholdStore, query: TieredPlacementThresholdQuery): TieredPlacementThreshold[] {
  return query.apply(store.list());
}

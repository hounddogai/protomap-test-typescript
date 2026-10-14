import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredWarmupThreshold } from "./tiered-warmup-threshold.js";

/** Keeps tiered warmup thresholds by code. */
export interface TieredWarmupThresholdStore {
  find(code: string): TieredWarmupThreshold | undefined;
  save(item: TieredWarmupThreshold): void;
  remove(code: string): boolean;
  list(): TieredWarmupThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredWarmupThresholdStore implements TieredWarmupThresholdStore {
  items: Map<string, TieredWarmupThreshold>;
  order: string[];

  constructor(items: Map<string, TieredWarmupThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredWarmupThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredWarmupThreshold): void {
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

  list(): TieredWarmupThreshold[] {
    const out: TieredWarmupThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredWarmupThresholdStore(): TieredWarmupThresholdStore {
  return new MemoryTieredWarmupThresholdStore(new Map<string, TieredWarmupThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredWarmupThresholdStore implements TieredWarmupThresholdStore {
  inner: TieredWarmupThresholdStore;
  cache: cache.TtlCache<TieredWarmupThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredWarmupThresholdStore,
    cacheValue: cache.TtlCache<TieredWarmupThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredWarmupThreshold | undefined {
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

  save(item: TieredWarmupThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredWarmupThreshold[] {
    return this.inner.list();
  }
}

export function newCachedTieredWarmupThresholdStore(inner: TieredWarmupThresholdStore, ttl: number, clockValue: clock.Clock): TieredWarmupThresholdStore {
  return new CachedTieredWarmupThresholdStore(
    inner,
    cache.newTtlCache<TieredWarmupThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered warmup thresholds. Empty fields match all. */
export class TieredWarmupThresholdQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredWarmupThreshold): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredWarmupThreshold[]): TieredWarmupThreshold[] {
    const matched = collections.filter(items, (candidate: TieredWarmupThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredWarmupThresholds(store: TieredWarmupThresholdStore, query: TieredWarmupThresholdQuery): TieredWarmupThreshold[] {
  return query.apply(store.list());
}

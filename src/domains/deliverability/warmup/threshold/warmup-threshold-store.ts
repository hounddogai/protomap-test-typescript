import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupThreshold } from "./warmup-threshold.js";

/** Keeps warmup thresholds by code. */
export interface WarmupThresholdStore {
  find(code: string): WarmupThreshold | undefined;
  save(item: WarmupThreshold): void;
  remove(code: string): boolean;
  list(): WarmupThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupThresholdStore implements WarmupThresholdStore {
  items: Map<string, WarmupThreshold>;
  order: string[];

  constructor(items: Map<string, WarmupThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupThreshold): void {
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

  list(): WarmupThreshold[] {
    const out: WarmupThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupThresholdStore(): WarmupThresholdStore {
  return new MemoryWarmupThresholdStore(new Map<string, WarmupThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupThresholdStore implements WarmupThresholdStore {
  inner: WarmupThresholdStore;
  cache: cache.TtlCache<WarmupThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupThresholdStore,
    cacheValue: cache.TtlCache<WarmupThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupThreshold | undefined {
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

  save(item: WarmupThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupThreshold[] {
    return this.inner.list();
  }
}

export function newCachedWarmupThresholdStore(inner: WarmupThresholdStore, ttl: number, clockValue: clock.Clock): WarmupThresholdStore {
  return new CachedWarmupThresholdStore(inner, cache.newTtlCache<WarmupThreshold>(256, ttl, clockValue), 0, 0);
}

/** Selects warmup thresholds. Empty fields match all. */
export class WarmupThresholdQuery {
  unit: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBatchSize: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupThreshold): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupThreshold[]): WarmupThreshold[] {
    const matched = collections.filter(items, (candidate: WarmupThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupThresholds(store: WarmupThresholdStore, query: WarmupThresholdQuery): WarmupThreshold[] {
  return query.apply(store.list());
}

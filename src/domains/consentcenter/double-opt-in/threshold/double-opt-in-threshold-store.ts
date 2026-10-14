import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInThreshold } from "./double-opt-in-threshold.js";

/** Keeps double opt in thresholds by code. */
export interface DoubleOptInThresholdStore {
  find(code: string): DoubleOptInThreshold | undefined;
  save(item: DoubleOptInThreshold): void;
  remove(code: string): boolean;
  list(): DoubleOptInThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInThresholdStore implements DoubleOptInThresholdStore {
  items: Map<string, DoubleOptInThreshold>;
  order: string[];

  constructor(items: Map<string, DoubleOptInThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInThreshold): void {
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

  list(): DoubleOptInThreshold[] {
    const out: DoubleOptInThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInThresholdStore(): DoubleOptInThresholdStore {
  return new MemoryDoubleOptInThresholdStore(new Map<string, DoubleOptInThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInThresholdStore implements DoubleOptInThresholdStore {
  inner: DoubleOptInThresholdStore;
  cache: cache.TtlCache<DoubleOptInThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInThresholdStore,
    cacheValue: cache.TtlCache<DoubleOptInThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInThreshold | undefined {
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

  save(item: DoubleOptInThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInThreshold[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInThresholdStore(inner: DoubleOptInThresholdStore, ttl: number, clockValue: clock.Clock): DoubleOptInThresholdStore {
  return new CachedDoubleOptInThresholdStore(
    inner,
    cache.newTtlCache<DoubleOptInThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects double opt in thresholds. Empty fields match all. */
export class DoubleOptInThresholdQuery {
  utmSource: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBatchSize: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInThreshold): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInThreshold[]): DoubleOptInThreshold[] {
    const matched = collections.filter(items, (candidate: DoubleOptInThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInThresholds(store: DoubleOptInThresholdStore, query: DoubleOptInThresholdQuery): DoubleOptInThreshold[] {
  return query.apply(store.list());
}

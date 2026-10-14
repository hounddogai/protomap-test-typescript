import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedSenderThreshold } from "./weighted-sender-threshold.js";

/** Keeps weighted sender thresholds by code. */
export interface WeightedSenderThresholdStore {
  find(code: string): WeightedSenderThreshold | undefined;
  save(item: WeightedSenderThreshold): void;
  remove(code: string): boolean;
  list(): WeightedSenderThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedSenderThresholdStore implements WeightedSenderThresholdStore {
  items: Map<string, WeightedSenderThreshold>;
  order: string[];

  constructor(items: Map<string, WeightedSenderThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedSenderThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedSenderThreshold): void {
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

  list(): WeightedSenderThreshold[] {
    const out: WeightedSenderThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedSenderThresholdStore(): WeightedSenderThresholdStore {
  return new MemoryWeightedSenderThresholdStore(new Map<string, WeightedSenderThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedSenderThresholdStore implements WeightedSenderThresholdStore {
  inner: WeightedSenderThresholdStore;
  cache: cache.TtlCache<WeightedSenderThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedSenderThresholdStore,
    cacheValue: cache.TtlCache<WeightedSenderThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedSenderThreshold | undefined {
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

  save(item: WeightedSenderThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedSenderThreshold[] {
    return this.inner.list();
  }
}

export function newCachedWeightedSenderThresholdStore(inner: WeightedSenderThresholdStore, ttl: number, clockValue: clock.Clock): WeightedSenderThresholdStore {
  return new CachedWeightedSenderThresholdStore(
    inner,
    cache.newTtlCache<WeightedSenderThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted sender thresholds. Empty fields match all. */
export class WeightedSenderThresholdQuery {
  utmSource: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minGraceDays: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedSenderThreshold): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedSenderThreshold[]): WeightedSenderThreshold[] {
    const matched = collections.filter(items, (candidate: WeightedSenderThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedSenderThresholds(store: WeightedSenderThresholdStore, query: WeightedSenderThresholdQuery): WeightedSenderThreshold[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

/** Keeps weighted fraud check mappings by code. */
export interface WeightedFraudCheckMappingStore {
  find(code: string): WeightedFraudCheckMapping | undefined;
  save(item: WeightedFraudCheckMapping): void;
  remove(code: string): boolean;
  list(): WeightedFraudCheckMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedFraudCheckMappingStore implements WeightedFraudCheckMappingStore {
  items: Map<string, WeightedFraudCheckMapping>;
  order: string[];

  constructor(items: Map<string, WeightedFraudCheckMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedFraudCheckMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedFraudCheckMapping): void {
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

  list(): WeightedFraudCheckMapping[] {
    const out: WeightedFraudCheckMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedFraudCheckMappingStore(): WeightedFraudCheckMappingStore {
  return new MemoryWeightedFraudCheckMappingStore(new Map<string, WeightedFraudCheckMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedFraudCheckMappingStore implements WeightedFraudCheckMappingStore {
  inner: WeightedFraudCheckMappingStore;
  cache: cache.TtlCache<WeightedFraudCheckMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedFraudCheckMappingStore,
    cacheValue: cache.TtlCache<WeightedFraudCheckMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedFraudCheckMapping | undefined {
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

  save(item: WeightedFraudCheckMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedFraudCheckMapping[] {
    return this.inner.list();
  }
}

export function newCachedWeightedFraudCheckMappingStore(inner: WeightedFraudCheckMappingStore, ttl: number, clockValue: clock.Clock): WeightedFraudCheckMappingStore {
  return new CachedWeightedFraudCheckMappingStore(
    inner,
    cache.newTtlCache<WeightedFraudCheckMapping>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted fraud check mappings. Empty fields match all. */
export class WeightedFraudCheckMappingQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedFraudCheckMapping): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedFraudCheckMapping[]): WeightedFraudCheckMapping[] {
    const matched = collections.filter(items, (candidate: WeightedFraudCheckMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedFraudCheckMappings(store: WeightedFraudCheckMappingStore, query: WeightedFraudCheckMappingQuery): WeightedFraudCheckMapping[] {
  return query.apply(store.list());
}

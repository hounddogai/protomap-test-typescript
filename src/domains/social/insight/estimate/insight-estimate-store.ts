import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightEstimate } from "./insight-estimate.js";

/** Keeps insight estimates by code. */
export interface InsightEstimateStore {
  find(code: string): InsightEstimate | undefined;
  save(item: InsightEstimate): void;
  remove(code: string): boolean;
  list(): InsightEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightEstimateStore implements InsightEstimateStore {
  items: Map<string, InsightEstimate>;
  order: string[];

  constructor(items: Map<string, InsightEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightEstimate): void {
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

  list(): InsightEstimate[] {
    const out: InsightEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightEstimateStore(): InsightEstimateStore {
  return new MemoryInsightEstimateStore(new Map<string, InsightEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightEstimateStore implements InsightEstimateStore {
  inner: InsightEstimateStore;
  cache: cache.TtlCache<InsightEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightEstimateStore,
    cacheValue: cache.TtlCache<InsightEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightEstimate | undefined {
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

  save(item: InsightEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightEstimate[] {
    return this.inner.list();
  }
}

export function newCachedInsightEstimateStore(inner: InsightEstimateStore, ttl: number, clockValue: clock.Clock): InsightEstimateStore {
  return new CachedInsightEstimateStore(inner, cache.newTtlCache<InsightEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects insight estimates. Empty fields match all. */
export class InsightEstimateQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightEstimate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightEstimate[]): InsightEstimate[] {
    const matched = collections.filter(items, (candidate: InsightEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightEstimates(store: InsightEstimateStore, query: InsightEstimateQuery): InsightEstimate[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionEstimate } from "./retention-estimate.js";

/** Keeps retention estimates by code. */
export interface RetentionEstimateStore {
  find(code: string): RetentionEstimate | undefined;
  save(item: RetentionEstimate): void;
  remove(code: string): boolean;
  list(): RetentionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionEstimateStore implements RetentionEstimateStore {
  items: Map<string, RetentionEstimate>;
  order: string[];

  constructor(items: Map<string, RetentionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionEstimate): void {
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

  list(): RetentionEstimate[] {
    const out: RetentionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionEstimateStore(): RetentionEstimateStore {
  return new MemoryRetentionEstimateStore(new Map<string, RetentionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionEstimateStore implements RetentionEstimateStore {
  inner: RetentionEstimateStore;
  cache: cache.TtlCache<RetentionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionEstimateStore,
    cacheValue: cache.TtlCache<RetentionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionEstimate | undefined {
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

  save(item: RetentionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedRetentionEstimateStore(inner: RetentionEstimateStore, ttl: number, clockValue: clock.Clock): RetentionEstimateStore {
  return new CachedRetentionEstimateStore(inner, cache.newTtlCache<RetentionEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects retention estimates. Empty fields match all. */
export class RetentionEstimateQuery {
  region: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionEstimate): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionEstimate[]): RetentionEstimate[] {
    const matched = collections.filter(items, (candidate: RetentionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionEstimates(store: RetentionEstimateStore, query: RetentionEstimateQuery): RetentionEstimate[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionEstimate } from "./suppression-estimate.js";

/** Keeps suppression estimates by code. */
export interface SuppressionEstimateStore {
  find(code: string): SuppressionEstimate | undefined;
  save(item: SuppressionEstimate): void;
  remove(code: string): boolean;
  list(): SuppressionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionEstimateStore implements SuppressionEstimateStore {
  items: Map<string, SuppressionEstimate>;
  order: string[];

  constructor(items: Map<string, SuppressionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionEstimate): void {
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

  list(): SuppressionEstimate[] {
    const out: SuppressionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionEstimateStore(): SuppressionEstimateStore {
  return new MemorySuppressionEstimateStore(new Map<string, SuppressionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionEstimateStore implements SuppressionEstimateStore {
  inner: SuppressionEstimateStore;
  cache: cache.TtlCache<SuppressionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionEstimateStore,
    cacheValue: cache.TtlCache<SuppressionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionEstimate | undefined {
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

  save(item: SuppressionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionEstimateStore(inner: SuppressionEstimateStore, ttl: number, clockValue: clock.Clock): SuppressionEstimateStore {
  return new CachedSuppressionEstimateStore(inner, cache.newTtlCache<SuppressionEstimate>(128, ttl, clockValue), 0, 0);
}

/** Selects suppression estimates. Empty fields match all. */
export class SuppressionEstimateQuery {
  utmSource: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minVersion: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionEstimate): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionEstimate[]): SuppressionEstimate[] {
    const matched = collections.filter(items, (candidate: SuppressionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionEstimates(store: SuppressionEstimateStore, query: SuppressionEstimateQuery): SuppressionEstimate[] {
  return query.apply(store.list());
}

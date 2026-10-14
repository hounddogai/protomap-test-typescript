import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFraudCheckSummary } from "./adaptive-fraud-check-summary.js";

/** Keeps adaptive fraud check summaries by code. */
export interface AdaptiveFraudCheckSummaryStore {
  find(code: string): AdaptiveFraudCheckSummary | undefined;
  save(item: AdaptiveFraudCheckSummary): void;
  remove(code: string): boolean;
  list(): AdaptiveFraudCheckSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFraudCheckSummaryStore implements AdaptiveFraudCheckSummaryStore {
  items: Map<string, AdaptiveFraudCheckSummary>;
  order: string[];

  constructor(items: Map<string, AdaptiveFraudCheckSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFraudCheckSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFraudCheckSummary): void {
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

  list(): AdaptiveFraudCheckSummary[] {
    const out: AdaptiveFraudCheckSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFraudCheckSummaryStore(): AdaptiveFraudCheckSummaryStore {
  return new MemoryAdaptiveFraudCheckSummaryStore(new Map<string, AdaptiveFraudCheckSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFraudCheckSummaryStore implements AdaptiveFraudCheckSummaryStore {
  inner: AdaptiveFraudCheckSummaryStore;
  cache: cache.TtlCache<AdaptiveFraudCheckSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFraudCheckSummaryStore,
    cacheValue: cache.TtlCache<AdaptiveFraudCheckSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFraudCheckSummary | undefined {
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

  save(item: AdaptiveFraudCheckSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFraudCheckSummary[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFraudCheckSummaryStore(inner: AdaptiveFraudCheckSummaryStore, ttl: number, clockValue: clock.Clock): AdaptiveFraudCheckSummaryStore {
  return new CachedAdaptiveFraudCheckSummaryStore(
    inner,
    cache.newTtlCache<AdaptiveFraudCheckSummary>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive fraud check summaries. Empty fields match all. */
export class AdaptiveFraudCheckSummaryQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFraudCheckSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFraudCheckSummary[]): AdaptiveFraudCheckSummary[] {
    const matched = collections.filter(items, (candidate: AdaptiveFraudCheckSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFraudCheckSummaries(store: AdaptiveFraudCheckSummaryStore, query: AdaptiveFraudCheckSummaryQuery): AdaptiveFraudCheckSummary[] {
  return query.apply(store.list());
}

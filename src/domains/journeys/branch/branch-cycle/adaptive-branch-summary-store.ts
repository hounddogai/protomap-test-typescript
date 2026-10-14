import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveBranchSummary } from "./adaptive-branch-summary.js";

/** Keeps adaptive branch summaries by code. */
export interface AdaptiveBranchSummaryStore {
  find(code: string): AdaptiveBranchSummary | undefined;
  save(item: AdaptiveBranchSummary): void;
  remove(code: string): boolean;
  list(): AdaptiveBranchSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveBranchSummaryStore implements AdaptiveBranchSummaryStore {
  items: Map<string, AdaptiveBranchSummary>;
  order: string[];

  constructor(items: Map<string, AdaptiveBranchSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveBranchSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveBranchSummary): void {
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

  list(): AdaptiveBranchSummary[] {
    const out: AdaptiveBranchSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveBranchSummaryStore(): AdaptiveBranchSummaryStore {
  return new MemoryAdaptiveBranchSummaryStore(new Map<string, AdaptiveBranchSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveBranchSummaryStore implements AdaptiveBranchSummaryStore {
  inner: AdaptiveBranchSummaryStore;
  cache: cache.TtlCache<AdaptiveBranchSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveBranchSummaryStore,
    cacheValue: cache.TtlCache<AdaptiveBranchSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveBranchSummary | undefined {
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

  save(item: AdaptiveBranchSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveBranchSummary[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveBranchSummaryStore(inner: AdaptiveBranchSummaryStore, ttl: number, clockValue: clock.Clock): AdaptiveBranchSummaryStore {
  return new CachedAdaptiveBranchSummaryStore(
    inner,
    cache.newTtlCache<AdaptiveBranchSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive branch summaries. Empty fields match all. */
export class AdaptiveBranchSummaryQuery {
  unit: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCeiling: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveBranchSummary): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveBranchSummary[]): AdaptiveBranchSummary[] {
    const matched = collections.filter(items, (candidate: AdaptiveBranchSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveBranchSummaries(store: AdaptiveBranchSummaryStore, query: AdaptiveBranchSummaryQuery): AdaptiveBranchSummary[] {
  return query.apply(store.list());
}

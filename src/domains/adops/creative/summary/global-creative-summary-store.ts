import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalCreativeSummary } from "./global-creative-summary.js";

/** Keeps global creative summaries by code. */
export interface GlobalCreativeSummaryStore {
  find(code: string): GlobalCreativeSummary | undefined;
  save(item: GlobalCreativeSummary): void;
  remove(code: string): boolean;
  list(): GlobalCreativeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalCreativeSummaryStore implements GlobalCreativeSummaryStore {
  items: Map<string, GlobalCreativeSummary>;
  order: string[];

  constructor(items: Map<string, GlobalCreativeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalCreativeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalCreativeSummary): void {
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

  list(): GlobalCreativeSummary[] {
    const out: GlobalCreativeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalCreativeSummaryStore(): GlobalCreativeSummaryStore {
  return new MemoryGlobalCreativeSummaryStore(new Map<string, GlobalCreativeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalCreativeSummaryStore implements GlobalCreativeSummaryStore {
  inner: GlobalCreativeSummaryStore;
  cache: cache.TtlCache<GlobalCreativeSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalCreativeSummaryStore,
    cacheValue: cache.TtlCache<GlobalCreativeSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalCreativeSummary | undefined {
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

  save(item: GlobalCreativeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalCreativeSummary[] {
    return this.inner.list();
  }
}

export function newCachedGlobalCreativeSummaryStore(inner: GlobalCreativeSummaryStore, ttl: number, clockValue: clock.Clock): GlobalCreativeSummaryStore {
  return new CachedGlobalCreativeSummaryStore(
    inner,
    cache.newTtlCache<GlobalCreativeSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global creative summaries. Empty fields match all. */
export class GlobalCreativeSummaryQuery {
  region: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCost: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalCreativeSummary): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalCreativeSummary[]): GlobalCreativeSummary[] {
    const matched = collections.filter(items, (candidate: GlobalCreativeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalCreativeSummaries(store: GlobalCreativeSummaryStore, query: GlobalCreativeSummaryQuery): GlobalCreativeSummary[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRewardSummary } from "./global-reward-summary.js";

/** Keeps global reward summaries by code. */
export interface GlobalRewardSummaryStore {
  find(code: string): GlobalRewardSummary | undefined;
  save(item: GlobalRewardSummary): void;
  remove(code: string): boolean;
  list(): GlobalRewardSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRewardSummaryStore implements GlobalRewardSummaryStore {
  items: Map<string, GlobalRewardSummary>;
  order: string[];

  constructor(items: Map<string, GlobalRewardSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRewardSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRewardSummary): void {
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

  list(): GlobalRewardSummary[] {
    const out: GlobalRewardSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRewardSummaryStore(): GlobalRewardSummaryStore {
  return new MemoryGlobalRewardSummaryStore(new Map<string, GlobalRewardSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRewardSummaryStore implements GlobalRewardSummaryStore {
  inner: GlobalRewardSummaryStore;
  cache: cache.TtlCache<GlobalRewardSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRewardSummaryStore,
    cacheValue: cache.TtlCache<GlobalRewardSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRewardSummary | undefined {
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

  save(item: GlobalRewardSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRewardSummary[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRewardSummaryStore(inner: GlobalRewardSummaryStore, ttl: number, clockValue: clock.Clock): GlobalRewardSummaryStore {
  return new CachedGlobalRewardSummaryStore(inner, cache.newTtlCache<GlobalRewardSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects global reward summaries. Empty fields match all. */
export class GlobalRewardSummaryQuery {
  region: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBid: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRewardSummary): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRewardSummary[]): GlobalRewardSummary[] {
    const matched = collections.filter(items, (candidate: GlobalRewardSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRewardSummaries(store: GlobalRewardSummaryStore, query: GlobalRewardSummaryQuery): GlobalRewardSummary[] {
  return query.apply(store.list());
}

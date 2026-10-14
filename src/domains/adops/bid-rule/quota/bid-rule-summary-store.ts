import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRuleSummary } from "./bid-rule-summary.js";

/** Keeps bid rule summaries by code. */
export interface BidRuleSummaryStore {
  find(code: string): BidRuleSummary | undefined;
  save(item: BidRuleSummary): void;
  remove(code: string): boolean;
  list(): BidRuleSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRuleSummaryStore implements BidRuleSummaryStore {
  items: Map<string, BidRuleSummary>;
  order: string[];

  constructor(items: Map<string, BidRuleSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRuleSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRuleSummary): void {
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

  list(): BidRuleSummary[] {
    const out: BidRuleSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRuleSummaryStore(): BidRuleSummaryStore {
  return new MemoryBidRuleSummaryStore(new Map<string, BidRuleSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRuleSummaryStore implements BidRuleSummaryStore {
  inner: BidRuleSummaryStore;
  cache: cache.TtlCache<BidRuleSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRuleSummaryStore,
    cacheValue: cache.TtlCache<BidRuleSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRuleSummary | undefined {
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

  save(item: BidRuleSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRuleSummary[] {
    return this.inner.list();
  }
}

export function newCachedBidRuleSummaryStore(inner: BidRuleSummaryStore, ttl: number, clockValue: clock.Clock): BidRuleSummaryStore {
  return new CachedBidRuleSummaryStore(inner, cache.newTtlCache<BidRuleSummary>(512, ttl, clockValue), 0, 0);
}

/** Selects bid rule summaries. Empty fields match all. */
export class BidRuleSummaryQuery {
  name: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWeight: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRuleSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRuleSummary[]): BidRuleSummary[] {
    const matched = collections.filter(items, (candidate: BidRuleSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRuleSummaries(store: BidRuleSummaryStore, query: BidRuleSummaryQuery): BidRuleSummary[] {
  return query.apply(store.list());
}

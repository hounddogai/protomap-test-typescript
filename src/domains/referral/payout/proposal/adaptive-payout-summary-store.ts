import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptivePayoutSummary } from "./adaptive-payout-summary.js";

/** Keeps adaptive payout summaries by code. */
export interface AdaptivePayoutSummaryStore {
  find(code: string): AdaptivePayoutSummary | undefined;
  save(item: AdaptivePayoutSummary): void;
  remove(code: string): boolean;
  list(): AdaptivePayoutSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptivePayoutSummaryStore implements AdaptivePayoutSummaryStore {
  items: Map<string, AdaptivePayoutSummary>;
  order: string[];

  constructor(items: Map<string, AdaptivePayoutSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptivePayoutSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptivePayoutSummary): void {
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

  list(): AdaptivePayoutSummary[] {
    const out: AdaptivePayoutSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptivePayoutSummaryStore(): AdaptivePayoutSummaryStore {
  return new MemoryAdaptivePayoutSummaryStore(new Map<string, AdaptivePayoutSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptivePayoutSummaryStore implements AdaptivePayoutSummaryStore {
  inner: AdaptivePayoutSummaryStore;
  cache: cache.TtlCache<AdaptivePayoutSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptivePayoutSummaryStore,
    cacheValue: cache.TtlCache<AdaptivePayoutSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptivePayoutSummary | undefined {
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

  save(item: AdaptivePayoutSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptivePayoutSummary[] {
    return this.inner.list();
  }
}

export function newCachedAdaptivePayoutSummaryStore(inner: AdaptivePayoutSummaryStore, ttl: number, clockValue: clock.Clock): AdaptivePayoutSummaryStore {
  return new CachedAdaptivePayoutSummaryStore(
    inner,
    cache.newTtlCache<AdaptivePayoutSummary>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive payout summaries. Empty fields match all. */
export class AdaptivePayoutSummaryQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptivePayoutSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptivePayoutSummary[]): AdaptivePayoutSummary[] {
    const matched = collections.filter(items, (candidate: AdaptivePayoutSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptivePayoutSummaries(store: AdaptivePayoutSummaryStore, query: AdaptivePayoutSummaryQuery): AdaptivePayoutSummary[] {
  return query.apply(store.list());
}

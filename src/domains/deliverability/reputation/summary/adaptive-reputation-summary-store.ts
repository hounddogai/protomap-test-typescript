import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveReputationSummary } from "./adaptive-reputation-summary.js";

/** Keeps adaptive reputation summaries by code. */
export interface AdaptiveReputationSummaryStore {
  find(code: string): AdaptiveReputationSummary | undefined;
  save(item: AdaptiveReputationSummary): void;
  remove(code: string): boolean;
  list(): AdaptiveReputationSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveReputationSummaryStore implements AdaptiveReputationSummaryStore {
  items: Map<string, AdaptiveReputationSummary>;
  order: string[];

  constructor(items: Map<string, AdaptiveReputationSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveReputationSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveReputationSummary): void {
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

  list(): AdaptiveReputationSummary[] {
    const out: AdaptiveReputationSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveReputationSummaryStore(): AdaptiveReputationSummaryStore {
  return new MemoryAdaptiveReputationSummaryStore(new Map<string, AdaptiveReputationSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveReputationSummaryStore implements AdaptiveReputationSummaryStore {
  inner: AdaptiveReputationSummaryStore;
  cache: cache.TtlCache<AdaptiveReputationSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveReputationSummaryStore,
    cacheValue: cache.TtlCache<AdaptiveReputationSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveReputationSummary | undefined {
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

  save(item: AdaptiveReputationSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveReputationSummary[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveReputationSummaryStore(inner: AdaptiveReputationSummaryStore, ttl: number, clockValue: clock.Clock): AdaptiveReputationSummaryStore {
  return new CachedAdaptiveReputationSummaryStore(
    inner,
    cache.newTtlCache<AdaptiveReputationSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive reputation summaries. Empty fields match all. */
export class AdaptiveReputationSummaryQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveReputationSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveReputationSummary[]): AdaptiveReputationSummary[] {
    const matched = collections.filter(items, (candidate: AdaptiveReputationSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveReputationSummaries(store: AdaptiveReputationSummaryStore, query: AdaptiveReputationSummaryQuery): AdaptiveReputationSummary[] {
  return query.apply(store.list());
}

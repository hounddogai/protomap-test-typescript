import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackInsightSummary } from "./fallback-insight-summary.js";

/** Keeps fallback insight summaries by code. */
export interface FallbackInsightSummaryStore {
  find(code: string): FallbackInsightSummary | undefined;
  save(item: FallbackInsightSummary): void;
  remove(code: string): boolean;
  list(): FallbackInsightSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackInsightSummaryStore implements FallbackInsightSummaryStore {
  items: Map<string, FallbackInsightSummary>;
  order: string[];

  constructor(items: Map<string, FallbackInsightSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackInsightSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackInsightSummary): void {
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

  list(): FallbackInsightSummary[] {
    const out: FallbackInsightSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackInsightSummaryStore(): FallbackInsightSummaryStore {
  return new MemoryFallbackInsightSummaryStore(new Map<string, FallbackInsightSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackInsightSummaryStore implements FallbackInsightSummaryStore {
  inner: FallbackInsightSummaryStore;
  cache: cache.TtlCache<FallbackInsightSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackInsightSummaryStore,
    cacheValue: cache.TtlCache<FallbackInsightSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackInsightSummary | undefined {
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

  save(item: FallbackInsightSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackInsightSummary[] {
    return this.inner.list();
  }
}

export function newCachedFallbackInsightSummaryStore(inner: FallbackInsightSummaryStore, ttl: number, clockValue: clock.Clock): FallbackInsightSummaryStore {
  return new CachedFallbackInsightSummaryStore(
    inner,
    cache.newTtlCache<FallbackInsightSummary>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback insight summaries. Empty fields match all. */
export class FallbackInsightSummaryQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackInsightSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackInsightSummary[]): FallbackInsightSummary[] {
    const matched = collections.filter(items, (candidate: FallbackInsightSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackInsightSummaries(store: FallbackInsightSummaryStore, query: FallbackInsightSummaryQuery): FallbackInsightSummary[] {
  return query.apply(store.list());
}

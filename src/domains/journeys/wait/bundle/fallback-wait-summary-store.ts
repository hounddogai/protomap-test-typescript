import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackWaitSummary } from "./fallback-wait-summary.js";

/** Keeps fallback wait summaries by code. */
export interface FallbackWaitSummaryStore {
  find(code: string): FallbackWaitSummary | undefined;
  save(item: FallbackWaitSummary): void;
  remove(code: string): boolean;
  list(): FallbackWaitSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackWaitSummaryStore implements FallbackWaitSummaryStore {
  items: Map<string, FallbackWaitSummary>;
  order: string[];

  constructor(items: Map<string, FallbackWaitSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackWaitSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackWaitSummary): void {
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

  list(): FallbackWaitSummary[] {
    const out: FallbackWaitSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackWaitSummaryStore(): FallbackWaitSummaryStore {
  return new MemoryFallbackWaitSummaryStore(new Map<string, FallbackWaitSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackWaitSummaryStore implements FallbackWaitSummaryStore {
  inner: FallbackWaitSummaryStore;
  cache: cache.TtlCache<FallbackWaitSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackWaitSummaryStore,
    cacheValue: cache.TtlCache<FallbackWaitSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackWaitSummary | undefined {
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

  save(item: FallbackWaitSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackWaitSummary[] {
    return this.inner.list();
  }
}

export function newCachedFallbackWaitSummaryStore(inner: FallbackWaitSummaryStore, ttl: number, clockValue: clock.Clock): FallbackWaitSummaryStore {
  return new CachedFallbackWaitSummaryStore(inner, cache.newTtlCache<FallbackWaitSummary>(256, ttl, clockValue), 0, 0);
}

/** Selects fallback wait summaries. Empty fields match all. */
export class FallbackWaitSummaryQuery {
  country: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minScore: number, statuses: string[], limit: number) {
    this.country = country;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackWaitSummary): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackWaitSummary[]): FallbackWaitSummary[] {
    const matched = collections.filter(items, (candidate: FallbackWaitSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackWaitSummaries(store: FallbackWaitSummaryStore, query: FallbackWaitSummaryQuery): FallbackWaitSummary[] {
  return query.apply(store.list());
}

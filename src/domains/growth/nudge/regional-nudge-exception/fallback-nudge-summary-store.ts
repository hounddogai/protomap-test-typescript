import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackNudgeSummary } from "./fallback-nudge-summary.js";

/** Keeps fallback nudge summaries by code. */
export interface FallbackNudgeSummaryStore {
  find(code: string): FallbackNudgeSummary | undefined;
  save(item: FallbackNudgeSummary): void;
  remove(code: string): boolean;
  list(): FallbackNudgeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackNudgeSummaryStore implements FallbackNudgeSummaryStore {
  items: Map<string, FallbackNudgeSummary>;
  order: string[];

  constructor(items: Map<string, FallbackNudgeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackNudgeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackNudgeSummary): void {
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

  list(): FallbackNudgeSummary[] {
    const out: FallbackNudgeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackNudgeSummaryStore(): FallbackNudgeSummaryStore {
  return new MemoryFallbackNudgeSummaryStore(new Map<string, FallbackNudgeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackNudgeSummaryStore implements FallbackNudgeSummaryStore {
  inner: FallbackNudgeSummaryStore;
  cache: cache.TtlCache<FallbackNudgeSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackNudgeSummaryStore,
    cacheValue: cache.TtlCache<FallbackNudgeSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackNudgeSummary | undefined {
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

  save(item: FallbackNudgeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackNudgeSummary[] {
    return this.inner.list();
  }
}

export function newCachedFallbackNudgeSummaryStore(inner: FallbackNudgeSummaryStore, ttl: number, clockValue: clock.Clock): FallbackNudgeSummaryStore {
  return new CachedFallbackNudgeSummaryStore(inner, cache.newTtlCache<FallbackNudgeSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects fallback nudge summaries. Empty fields match all. */
export class FallbackNudgeSummaryQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackNudgeSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackNudgeSummary[]): FallbackNudgeSummary[] {
    const matched = collections.filter(items, (candidate: FallbackNudgeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackNudgeSummaries(store: FallbackNudgeSummaryStore, query: FallbackNudgeSummaryQuery): FallbackNudgeSummary[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingInsightSummary } from "./pending-insight-summary.js";

/** Keeps pending insight summaries by code. */
export interface PendingInsightSummaryStore {
  find(code: string): PendingInsightSummary | undefined;
  save(item: PendingInsightSummary): void;
  remove(code: string): boolean;
  list(): PendingInsightSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingInsightSummaryStore implements PendingInsightSummaryStore {
  items: Map<string, PendingInsightSummary>;
  order: string[];

  constructor(items: Map<string, PendingInsightSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingInsightSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingInsightSummary): void {
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

  list(): PendingInsightSummary[] {
    const out: PendingInsightSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingInsightSummaryStore(): PendingInsightSummaryStore {
  return new MemoryPendingInsightSummaryStore(new Map<string, PendingInsightSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingInsightSummaryStore implements PendingInsightSummaryStore {
  inner: PendingInsightSummaryStore;
  cache: cache.TtlCache<PendingInsightSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingInsightSummaryStore,
    cacheValue: cache.TtlCache<PendingInsightSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingInsightSummary | undefined {
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

  save(item: PendingInsightSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingInsightSummary[] {
    return this.inner.list();
  }
}

export function newCachedPendingInsightSummaryStore(inner: PendingInsightSummaryStore, ttl: number, clockValue: clock.Clock): PendingInsightSummaryStore {
  return new CachedPendingInsightSummaryStore(
    inner,
    cache.newTtlCache<PendingInsightSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending insight summaries. Empty fields match all. */
export class PendingInsightSummaryQuery {
  locale: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingInsightSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingInsightSummary[]): PendingInsightSummary[] {
    const matched = collections.filter(items, (candidate: PendingInsightSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingInsightSummaries(store: PendingInsightSummaryStore, query: PendingInsightSummaryQuery): PendingInsightSummary[] {
  return query.apply(store.list());
}

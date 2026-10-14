import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFraudCheckSummary } from "./global-fraud-check-summary.js";

/** Keeps global fraud check summaries by code. */
export interface GlobalFraudCheckSummaryStore {
  find(code: string): GlobalFraudCheckSummary | undefined;
  save(item: GlobalFraudCheckSummary): void;
  remove(code: string): boolean;
  list(): GlobalFraudCheckSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFraudCheckSummaryStore implements GlobalFraudCheckSummaryStore {
  items: Map<string, GlobalFraudCheckSummary>;
  order: string[];

  constructor(items: Map<string, GlobalFraudCheckSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFraudCheckSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFraudCheckSummary): void {
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

  list(): GlobalFraudCheckSummary[] {
    const out: GlobalFraudCheckSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFraudCheckSummaryStore(): GlobalFraudCheckSummaryStore {
  return new MemoryGlobalFraudCheckSummaryStore(new Map<string, GlobalFraudCheckSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFraudCheckSummaryStore implements GlobalFraudCheckSummaryStore {
  inner: GlobalFraudCheckSummaryStore;
  cache: cache.TtlCache<GlobalFraudCheckSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFraudCheckSummaryStore,
    cacheValue: cache.TtlCache<GlobalFraudCheckSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFraudCheckSummary | undefined {
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

  save(item: GlobalFraudCheckSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFraudCheckSummary[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFraudCheckSummaryStore(inner: GlobalFraudCheckSummaryStore, ttl: number, clockValue: clock.Clock): GlobalFraudCheckSummaryStore {
  return new CachedGlobalFraudCheckSummaryStore(
    inner,
    cache.newTtlCache<GlobalFraudCheckSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global fraud check summaries. Empty fields match all. */
export class GlobalFraudCheckSummaryQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFraudCheckSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFraudCheckSummary[]): GlobalFraudCheckSummary[] {
    const matched = collections.filter(items, (candidate: GlobalFraudCheckSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFraudCheckSummaries(store: GlobalFraudCheckSummaryStore, query: GlobalFraudCheckSummaryQuery): GlobalFraudCheckSummary[] {
  return query.apply(store.list());
}

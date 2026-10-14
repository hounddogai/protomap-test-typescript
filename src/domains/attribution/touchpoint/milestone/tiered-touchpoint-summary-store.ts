import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

/** Keeps tiered touchpoint summaries by code. */
export interface TieredTouchpointSummaryStore {
  find(code: string): TieredTouchpointSummary | undefined;
  save(item: TieredTouchpointSummary): void;
  remove(code: string): boolean;
  list(): TieredTouchpointSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredTouchpointSummaryStore implements TieredTouchpointSummaryStore {
  items: Map<string, TieredTouchpointSummary>;
  order: string[];

  constructor(items: Map<string, TieredTouchpointSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredTouchpointSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredTouchpointSummary): void {
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

  list(): TieredTouchpointSummary[] {
    const out: TieredTouchpointSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredTouchpointSummaryStore(): TieredTouchpointSummaryStore {
  return new MemoryTieredTouchpointSummaryStore(new Map<string, TieredTouchpointSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredTouchpointSummaryStore implements TieredTouchpointSummaryStore {
  inner: TieredTouchpointSummaryStore;
  cache: cache.TtlCache<TieredTouchpointSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredTouchpointSummaryStore,
    cacheValue: cache.TtlCache<TieredTouchpointSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredTouchpointSummary | undefined {
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

  save(item: TieredTouchpointSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredTouchpointSummary[] {
    return this.inner.list();
  }
}

export function newCachedTieredTouchpointSummaryStore(inner: TieredTouchpointSummaryStore, ttl: number, clockValue: clock.Clock): TieredTouchpointSummaryStore {
  return new CachedTieredTouchpointSummaryStore(
    inner,
    cache.newTtlCache<TieredTouchpointSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered touchpoint summaries. Empty fields match all. */
export class TieredTouchpointSummaryQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredTouchpointSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredTouchpointSummary[]): TieredTouchpointSummary[] {
    const matched = collections.filter(items, (candidate: TieredTouchpointSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredTouchpointSummaries(store: TieredTouchpointSummaryStore, query: TieredTouchpointSummaryQuery): TieredTouchpointSummary[] {
  return query.apply(store.list());
}

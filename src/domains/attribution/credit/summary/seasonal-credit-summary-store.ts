import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCreditSummary } from "./seasonal-credit-summary.js";

/** Keeps seasonal credit summaries by code. */
export interface SeasonalCreditSummaryStore {
  find(code: string): SeasonalCreditSummary | undefined;
  save(item: SeasonalCreditSummary): void;
  remove(code: string): boolean;
  list(): SeasonalCreditSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCreditSummaryStore implements SeasonalCreditSummaryStore {
  items: Map<string, SeasonalCreditSummary>;
  order: string[];

  constructor(items: Map<string, SeasonalCreditSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCreditSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCreditSummary): void {
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

  list(): SeasonalCreditSummary[] {
    const out: SeasonalCreditSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCreditSummaryStore(): SeasonalCreditSummaryStore {
  return new MemorySeasonalCreditSummaryStore(new Map<string, SeasonalCreditSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCreditSummaryStore implements SeasonalCreditSummaryStore {
  inner: SeasonalCreditSummaryStore;
  cache: cache.TtlCache<SeasonalCreditSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCreditSummaryStore,
    cacheValue: cache.TtlCache<SeasonalCreditSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCreditSummary | undefined {
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

  save(item: SeasonalCreditSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCreditSummary[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCreditSummaryStore(inner: SeasonalCreditSummaryStore, ttl: number, clockValue: clock.Clock): SeasonalCreditSummaryStore {
  return new CachedSeasonalCreditSummaryStore(
    inner,
    cache.newTtlCache<SeasonalCreditSummary>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal credit summaries. Empty fields match all. */
export class SeasonalCreditSummaryQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCreditSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCreditSummary[]): SeasonalCreditSummary[] {
    const matched = collections.filter(items, (candidate: SeasonalCreditSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCreditSummaries(store: SeasonalCreditSummaryStore, query: SeasonalCreditSummaryQuery): SeasonalCreditSummary[] {
  return query.apply(store.list());
}

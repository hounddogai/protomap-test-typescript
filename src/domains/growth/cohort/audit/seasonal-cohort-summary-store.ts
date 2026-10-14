import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCohortSummary } from "./seasonal-cohort-summary.js";

/** Keeps seasonal cohort summaries by code. */
export interface SeasonalCohortSummaryStore {
  find(code: string): SeasonalCohortSummary | undefined;
  save(item: SeasonalCohortSummary): void;
  remove(code: string): boolean;
  list(): SeasonalCohortSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCohortSummaryStore implements SeasonalCohortSummaryStore {
  items: Map<string, SeasonalCohortSummary>;
  order: string[];

  constructor(items: Map<string, SeasonalCohortSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCohortSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCohortSummary): void {
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

  list(): SeasonalCohortSummary[] {
    const out: SeasonalCohortSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCohortSummaryStore(): SeasonalCohortSummaryStore {
  return new MemorySeasonalCohortSummaryStore(new Map<string, SeasonalCohortSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCohortSummaryStore implements SeasonalCohortSummaryStore {
  inner: SeasonalCohortSummaryStore;
  cache: cache.TtlCache<SeasonalCohortSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCohortSummaryStore,
    cacheValue: cache.TtlCache<SeasonalCohortSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCohortSummary | undefined {
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

  save(item: SeasonalCohortSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCohortSummary[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCohortSummaryStore(inner: SeasonalCohortSummaryStore, ttl: number, clockValue: clock.Clock): SeasonalCohortSummaryStore {
  return new CachedSeasonalCohortSummaryStore(
    inner,
    cache.newTtlCache<SeasonalCohortSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal cohort summaries. Empty fields match all. */
export class SeasonalCohortSummaryQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCohortSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCohortSummary[]): SeasonalCohortSummary[] {
    const matched = collections.filter(items, (candidate: SeasonalCohortSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCohortSummaries(store: SeasonalCohortSummaryStore, query: SeasonalCohortSummaryQuery): SeasonalCohortSummary[] {
  return query.apply(store.list());
}

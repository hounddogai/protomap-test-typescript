import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedTouchpointSummary } from "./capped-touchpoint-summary.js";

/** Keeps capped touchpoint summaries by code. */
export interface CappedTouchpointSummaryStore {
  find(code: string): CappedTouchpointSummary | undefined;
  save(item: CappedTouchpointSummary): void;
  remove(code: string): boolean;
  list(): CappedTouchpointSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedTouchpointSummaryStore implements CappedTouchpointSummaryStore {
  items: Map<string, CappedTouchpointSummary>;
  order: string[];

  constructor(items: Map<string, CappedTouchpointSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedTouchpointSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedTouchpointSummary): void {
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

  list(): CappedTouchpointSummary[] {
    const out: CappedTouchpointSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedTouchpointSummaryStore(): CappedTouchpointSummaryStore {
  return new MemoryCappedTouchpointSummaryStore(new Map<string, CappedTouchpointSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedTouchpointSummaryStore implements CappedTouchpointSummaryStore {
  inner: CappedTouchpointSummaryStore;
  cache: cache.TtlCache<CappedTouchpointSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedTouchpointSummaryStore,
    cacheValue: cache.TtlCache<CappedTouchpointSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedTouchpointSummary | undefined {
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

  save(item: CappedTouchpointSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedTouchpointSummary[] {
    return this.inner.list();
  }
}

export function newCachedCappedTouchpointSummaryStore(inner: CappedTouchpointSummaryStore, ttl: number, clockValue: clock.Clock): CappedTouchpointSummaryStore {
  return new CachedCappedTouchpointSummaryStore(
    inner,
    cache.newTtlCache<CappedTouchpointSummary>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped touchpoint summaries. Empty fields match all. */
export class CappedTouchpointSummaryQuery {
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

  matches(item: CappedTouchpointSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedTouchpointSummary[]): CappedTouchpointSummary[] {
    const matched = collections.filter(items, (candidate: CappedTouchpointSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedTouchpointSummaries(store: CappedTouchpointSummaryStore, query: CappedTouchpointSummaryQuery): CappedTouchpointSummary[] {
  return query.apply(store.list());
}

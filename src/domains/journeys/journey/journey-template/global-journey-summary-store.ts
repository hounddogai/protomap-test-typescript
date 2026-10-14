import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalJourneySummary } from "./global-journey-summary.js";

/** Keeps global journey summaries by code. */
export interface GlobalJourneySummaryStore {
  find(code: string): GlobalJourneySummary | undefined;
  save(item: GlobalJourneySummary): void;
  remove(code: string): boolean;
  list(): GlobalJourneySummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalJourneySummaryStore implements GlobalJourneySummaryStore {
  items: Map<string, GlobalJourneySummary>;
  order: string[];

  constructor(items: Map<string, GlobalJourneySummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalJourneySummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalJourneySummary): void {
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

  list(): GlobalJourneySummary[] {
    const out: GlobalJourneySummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalJourneySummaryStore(): GlobalJourneySummaryStore {
  return new MemoryGlobalJourneySummaryStore(new Map<string, GlobalJourneySummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalJourneySummaryStore implements GlobalJourneySummaryStore {
  inner: GlobalJourneySummaryStore;
  cache: cache.TtlCache<GlobalJourneySummary>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalJourneySummaryStore,
    cacheValue: cache.TtlCache<GlobalJourneySummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalJourneySummary | undefined {
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

  save(item: GlobalJourneySummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalJourneySummary[] {
    return this.inner.list();
  }
}

export function newCachedGlobalJourneySummaryStore(inner: GlobalJourneySummaryStore, ttl: number, clockValue: clock.Clock): GlobalJourneySummaryStore {
  return new CachedGlobalJourneySummaryStore(
    inner,
    cache.newTtlCache<GlobalJourneySummary>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global journey summaries. Empty fields match all. */
export class GlobalJourneySummaryQuery {
  source: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minThreshold: number, statuses: string[], limit: number) {
    this.source = source;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalJourneySummary): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalJourneySummary[]): GlobalJourneySummary[] {
    const matched = collections.filter(items, (candidate: GlobalJourneySummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalJourneySummaries(store: GlobalJourneySummaryStore, query: GlobalJourneySummaryQuery): GlobalJourneySummary[] {
  return query.apply(store.list());
}

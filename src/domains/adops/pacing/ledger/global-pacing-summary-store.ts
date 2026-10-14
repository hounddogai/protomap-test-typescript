import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPacingSummary } from "./global-pacing-summary.js";

/** Keeps global pacing summaries by code. */
export interface GlobalPacingSummaryStore {
  find(code: string): GlobalPacingSummary | undefined;
  save(item: GlobalPacingSummary): void;
  remove(code: string): boolean;
  list(): GlobalPacingSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPacingSummaryStore implements GlobalPacingSummaryStore {
  items: Map<string, GlobalPacingSummary>;
  order: string[];

  constructor(items: Map<string, GlobalPacingSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPacingSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPacingSummary): void {
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

  list(): GlobalPacingSummary[] {
    const out: GlobalPacingSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPacingSummaryStore(): GlobalPacingSummaryStore {
  return new MemoryGlobalPacingSummaryStore(new Map<string, GlobalPacingSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPacingSummaryStore implements GlobalPacingSummaryStore {
  inner: GlobalPacingSummaryStore;
  cache: cache.TtlCache<GlobalPacingSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPacingSummaryStore,
    cacheValue: cache.TtlCache<GlobalPacingSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPacingSummary | undefined {
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

  save(item: GlobalPacingSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPacingSummary[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPacingSummaryStore(inner: GlobalPacingSummaryStore, ttl: number, clockValue: clock.Clock): GlobalPacingSummaryStore {
  return new CachedGlobalPacingSummaryStore(inner, cache.newTtlCache<GlobalPacingSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects global pacing summaries. Empty fields match all. */
export class GlobalPacingSummaryQuery {
  utmSource: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCeiling: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPacingSummary): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPacingSummary[]): GlobalPacingSummary[] {
    const matched = collections.filter(items, (candidate: GlobalPacingSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPacingSummaries(store: GlobalPacingSummaryStore, query: GlobalPacingSummaryQuery): GlobalPacingSummary[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalBounceSummary } from "./global-bounce-summary.js";

/** Keeps global bounce summaries by code. */
export interface GlobalBounceSummaryStore {
  find(code: string): GlobalBounceSummary | undefined;
  save(item: GlobalBounceSummary): void;
  remove(code: string): boolean;
  list(): GlobalBounceSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalBounceSummaryStore implements GlobalBounceSummaryStore {
  items: Map<string, GlobalBounceSummary>;
  order: string[];

  constructor(items: Map<string, GlobalBounceSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalBounceSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalBounceSummary): void {
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

  list(): GlobalBounceSummary[] {
    const out: GlobalBounceSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalBounceSummaryStore(): GlobalBounceSummaryStore {
  return new MemoryGlobalBounceSummaryStore(new Map<string, GlobalBounceSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalBounceSummaryStore implements GlobalBounceSummaryStore {
  inner: GlobalBounceSummaryStore;
  cache: cache.TtlCache<GlobalBounceSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalBounceSummaryStore,
    cacheValue: cache.TtlCache<GlobalBounceSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalBounceSummary | undefined {
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

  save(item: GlobalBounceSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalBounceSummary[] {
    return this.inner.list();
  }
}

export function newCachedGlobalBounceSummaryStore(inner: GlobalBounceSummaryStore, ttl: number, clockValue: clock.Clock): GlobalBounceSummaryStore {
  return new CachedGlobalBounceSummaryStore(inner, cache.newTtlCache<GlobalBounceSummary>(128, ttl, clockValue), 0, 0);
}

/** Selects global bounce summaries. Empty fields match all. */
export class GlobalBounceSummaryQuery {
  name: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBatchSize: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalBounceSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalBounceSummary[]): GlobalBounceSummary[] {
    const matched = collections.filter(items, (candidate: GlobalBounceSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalBounceSummaries(store: GlobalBounceSummaryStore, query: GlobalBounceSummaryQuery): GlobalBounceSummary[] {
  return query.apply(store.list());
}

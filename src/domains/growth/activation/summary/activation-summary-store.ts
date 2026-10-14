import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationSummary } from "./activation-summary.js";

/** Keeps activation summaries by code. */
export interface ActivationSummaryStore {
  find(code: string): ActivationSummary | undefined;
  save(item: ActivationSummary): void;
  remove(code: string): boolean;
  list(): ActivationSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationSummaryStore implements ActivationSummaryStore {
  items: Map<string, ActivationSummary>;
  order: string[];

  constructor(items: Map<string, ActivationSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationSummary): void {
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

  list(): ActivationSummary[] {
    const out: ActivationSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationSummaryStore(): ActivationSummaryStore {
  return new MemoryActivationSummaryStore(new Map<string, ActivationSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationSummaryStore implements ActivationSummaryStore {
  inner: ActivationSummaryStore;
  cache: cache.TtlCache<ActivationSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationSummaryStore,
    cacheValue: cache.TtlCache<ActivationSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationSummary | undefined {
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

  save(item: ActivationSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationSummary[] {
    return this.inner.list();
  }
}

export function newCachedActivationSummaryStore(inner: ActivationSummaryStore, ttl: number, clockValue: clock.Clock): ActivationSummaryStore {
  return new CachedActivationSummaryStore(inner, cache.newTtlCache<ActivationSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects activation summaries. Empty fields match all. */
export class ActivationSummaryQuery {
  locale: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBatchSize: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationSummary[]): ActivationSummary[] {
    const matched = collections.filter(items, (candidate: ActivationSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationSummaries(store: ActivationSummaryStore, query: ActivationSummaryQuery): ActivationSummary[] {
  return query.apply(store.list());
}

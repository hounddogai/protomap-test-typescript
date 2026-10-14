import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackWarmupSummary } from "./fallback-warmup-summary.js";

/** Keeps fallback warmup summaries by code. */
export interface FallbackWarmupSummaryStore {
  find(code: string): FallbackWarmupSummary | undefined;
  save(item: FallbackWarmupSummary): void;
  remove(code: string): boolean;
  list(): FallbackWarmupSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackWarmupSummaryStore implements FallbackWarmupSummaryStore {
  items: Map<string, FallbackWarmupSummary>;
  order: string[];

  constructor(items: Map<string, FallbackWarmupSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackWarmupSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackWarmupSummary): void {
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

  list(): FallbackWarmupSummary[] {
    const out: FallbackWarmupSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackWarmupSummaryStore(): FallbackWarmupSummaryStore {
  return new MemoryFallbackWarmupSummaryStore(new Map<string, FallbackWarmupSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackWarmupSummaryStore implements FallbackWarmupSummaryStore {
  inner: FallbackWarmupSummaryStore;
  cache: cache.TtlCache<FallbackWarmupSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackWarmupSummaryStore,
    cacheValue: cache.TtlCache<FallbackWarmupSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackWarmupSummary | undefined {
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

  save(item: FallbackWarmupSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackWarmupSummary[] {
    return this.inner.list();
  }
}

export function newCachedFallbackWarmupSummaryStore(inner: FallbackWarmupSummaryStore, ttl: number, clockValue: clock.Clock): FallbackWarmupSummaryStore {
  return new CachedFallbackWarmupSummaryStore(
    inner,
    cache.newTtlCache<FallbackWarmupSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback warmup summaries. Empty fields match all. */
export class FallbackWarmupSummaryQuery {
  channel: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minGraceDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackWarmupSummary): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackWarmupSummary[]): FallbackWarmupSummary[] {
    const matched = collections.filter(items, (candidate: FallbackWarmupSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackWarmupSummaries(store: FallbackWarmupSummaryStore, query: FallbackWarmupSummaryQuery): FallbackWarmupSummary[] {
  return query.apply(store.list());
}

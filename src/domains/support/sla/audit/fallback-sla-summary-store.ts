import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSlaSummary } from "./fallback-sla-summary.js";

/** Keeps fallback sla summaries by code. */
export interface FallbackSlaSummaryStore {
  find(code: string): FallbackSlaSummary | undefined;
  save(item: FallbackSlaSummary): void;
  remove(code: string): boolean;
  list(): FallbackSlaSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSlaSummaryStore implements FallbackSlaSummaryStore {
  items: Map<string, FallbackSlaSummary>;
  order: string[];

  constructor(items: Map<string, FallbackSlaSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSlaSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSlaSummary): void {
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

  list(): FallbackSlaSummary[] {
    const out: FallbackSlaSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSlaSummaryStore(): FallbackSlaSummaryStore {
  return new MemoryFallbackSlaSummaryStore(new Map<string, FallbackSlaSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSlaSummaryStore implements FallbackSlaSummaryStore {
  inner: FallbackSlaSummaryStore;
  cache: cache.TtlCache<FallbackSlaSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSlaSummaryStore,
    cacheValue: cache.TtlCache<FallbackSlaSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSlaSummary | undefined {
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

  save(item: FallbackSlaSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSlaSummary[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSlaSummaryStore(inner: FallbackSlaSummaryStore, ttl: number, clockValue: clock.Clock): FallbackSlaSummaryStore {
  return new CachedFallbackSlaSummaryStore(inner, cache.newTtlCache<FallbackSlaSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects fallback sla summaries. Empty fields match all. */
export class FallbackSlaSummaryQuery {
  channel: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSlaSummary): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSlaSummary[]): FallbackSlaSummary[] {
    const matched = collections.filter(items, (candidate: FallbackSlaSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSlaSummaries(store: FallbackSlaSummaryStore, query: FallbackSlaSummaryQuery): FallbackSlaSummary[] {
  return query.apply(store.list());
}

import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFunnelSummary } from "./tiered-funnel-summary.js";

/** Keeps tiered funnel summaries by code. */
export interface TieredFunnelSummaryStore {
  find(code: string): TieredFunnelSummary | undefined;
  save(item: TieredFunnelSummary): void;
  remove(code: string): boolean;
  list(): TieredFunnelSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFunnelSummaryStore implements TieredFunnelSummaryStore {
  items: Map<string, TieredFunnelSummary>;
  order: string[];

  constructor(items: Map<string, TieredFunnelSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFunnelSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFunnelSummary): void {
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

  list(): TieredFunnelSummary[] {
    const out: TieredFunnelSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFunnelSummaryStore(): TieredFunnelSummaryStore {
  return new MemoryTieredFunnelSummaryStore(new Map<string, TieredFunnelSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFunnelSummaryStore implements TieredFunnelSummaryStore {
  inner: TieredFunnelSummaryStore;
  cache: cache.TtlCache<TieredFunnelSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFunnelSummaryStore,
    cacheValue: cache.TtlCache<TieredFunnelSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFunnelSummary | undefined {
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

  save(item: TieredFunnelSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFunnelSummary[] {
    return this.inner.list();
  }
}

export function newCachedTieredFunnelSummaryStore(inner: TieredFunnelSummaryStore, ttl: number, clockValue: clock.Clock): TieredFunnelSummaryStore {
  return new CachedTieredFunnelSummaryStore(inner, cache.newTtlCache<TieredFunnelSummary>(256, ttl, clockValue), 0, 0);
}

/** Selects tiered funnel summaries. Empty fields match all. */
export class TieredFunnelSummaryQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFunnelSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFunnelSummary[]): TieredFunnelSummary[] {
    const matched = collections.filter(items, (candidate: TieredFunnelSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFunnelSummaries(store: TieredFunnelSummaryStore, query: TieredFunnelSummaryQuery): TieredFunnelSummary[] {
  return query.apply(store.list());
}

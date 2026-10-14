import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelSummary } from "./funnel-summary.js";

/** Keeps funnel summaries by code. */
export interface FunnelSummaryStore {
  find(code: string): FunnelSummary | undefined;
  save(item: FunnelSummary): void;
  remove(code: string): boolean;
  list(): FunnelSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelSummaryStore implements FunnelSummaryStore {
  items: Map<string, FunnelSummary>;
  order: string[];

  constructor(items: Map<string, FunnelSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelSummary): void {
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

  list(): FunnelSummary[] {
    const out: FunnelSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelSummaryStore(): FunnelSummaryStore {
  return new MemoryFunnelSummaryStore(new Map<string, FunnelSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelSummaryStore implements FunnelSummaryStore {
  inner: FunnelSummaryStore;
  cache: cache.TtlCache<FunnelSummary>;
  hits: number;
  misses: number;

  constructor(inner: FunnelSummaryStore, cacheValue: cache.TtlCache<FunnelSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelSummary | undefined {
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

  save(item: FunnelSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelSummary[] {
    return this.inner.list();
  }
}

export function newCachedFunnelSummaryStore(inner: FunnelSummaryStore, ttl: number, clockValue: clock.Clock): FunnelSummaryStore {
  return new CachedFunnelSummaryStore(inner, cache.newTtlCache<FunnelSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects funnel summaries. Empty fields match all. */
export class FunnelSummaryQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelSummary[]): FunnelSummary[] {
    const matched = collections.filter(items, (candidate: FunnelSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelSummaries(store: FunnelSummaryStore, query: FunnelSummaryQuery): FunnelSummary[] {
  return query.apply(store.list());
}

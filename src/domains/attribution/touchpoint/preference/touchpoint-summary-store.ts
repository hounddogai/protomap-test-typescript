import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointSummary } from "./touchpoint-summary.js";

/** Keeps touchpoint summaries by code. */
export interface TouchpointSummaryStore {
  find(code: string): TouchpointSummary | undefined;
  save(item: TouchpointSummary): void;
  remove(code: string): boolean;
  list(): TouchpointSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointSummaryStore implements TouchpointSummaryStore {
  items: Map<string, TouchpointSummary>;
  order: string[];

  constructor(items: Map<string, TouchpointSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointSummary): void {
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

  list(): TouchpointSummary[] {
    const out: TouchpointSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointSummaryStore(): TouchpointSummaryStore {
  return new MemoryTouchpointSummaryStore(new Map<string, TouchpointSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointSummaryStore implements TouchpointSummaryStore {
  inner: TouchpointSummaryStore;
  cache: cache.TtlCache<TouchpointSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointSummaryStore,
    cacheValue: cache.TtlCache<TouchpointSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointSummary | undefined {
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

  save(item: TouchpointSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointSummary[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointSummaryStore(inner: TouchpointSummaryStore, ttl: number, clockValue: clock.Clock): TouchpointSummaryStore {
  return new CachedTouchpointSummaryStore(inner, cache.newTtlCache<TouchpointSummary>(128, ttl, clockValue), 0, 0);
}

/** Selects touchpoint summaries. Empty fields match all. */
export class TouchpointSummaryQuery {
  label: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCost: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointSummary[]): TouchpointSummary[] {
    const matched = collections.filter(items, (candidate: TouchpointSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointSummaries(store: TouchpointSummaryStore, query: TouchpointSummaryQuery): TouchpointSummary[] {
  return query.apply(store.list());
}

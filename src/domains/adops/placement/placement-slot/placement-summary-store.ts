import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementSummary } from "./placement-summary.js";

/** Keeps placement summaries by code. */
export interface PlacementSummaryStore {
  find(code: string): PlacementSummary | undefined;
  save(item: PlacementSummary): void;
  remove(code: string): boolean;
  list(): PlacementSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementSummaryStore implements PlacementSummaryStore {
  items: Map<string, PlacementSummary>;
  order: string[];

  constructor(items: Map<string, PlacementSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementSummary): void {
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

  list(): PlacementSummary[] {
    const out: PlacementSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementSummaryStore(): PlacementSummaryStore {
  return new MemoryPlacementSummaryStore(new Map<string, PlacementSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementSummaryStore implements PlacementSummaryStore {
  inner: PlacementSummaryStore;
  cache: cache.TtlCache<PlacementSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementSummaryStore,
    cacheValue: cache.TtlCache<PlacementSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementSummary | undefined {
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

  save(item: PlacementSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementSummary[] {
    return this.inner.list();
  }
}

export function newCachedPlacementSummaryStore(inner: PlacementSummaryStore, ttl: number, clockValue: clock.Clock): PlacementSummaryStore {
  return new CachedPlacementSummaryStore(inner, cache.newTtlCache<PlacementSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects placement summaries. Empty fields match all. */
export class PlacementSummaryQuery {
  channel: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minEndsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementSummary): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementSummary[]): PlacementSummary[] {
    const matched = collections.filter(items, (candidate: PlacementSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementSummaries(store: PlacementSummaryStore, query: PlacementSummaryQuery): PlacementSummary[] {
  return query.apply(store.list());
}

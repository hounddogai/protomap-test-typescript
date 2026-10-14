import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveTicketViewSummary } from "./adaptive-ticket-view-summary.js";

/** Keeps adaptive ticket view summaries by code. */
export interface AdaptiveTicketViewSummaryStore {
  find(code: string): AdaptiveTicketViewSummary | undefined;
  save(item: AdaptiveTicketViewSummary): void;
  remove(code: string): boolean;
  list(): AdaptiveTicketViewSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveTicketViewSummaryStore implements AdaptiveTicketViewSummaryStore {
  items: Map<string, AdaptiveTicketViewSummary>;
  order: string[];

  constructor(items: Map<string, AdaptiveTicketViewSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveTicketViewSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveTicketViewSummary): void {
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

  list(): AdaptiveTicketViewSummary[] {
    const out: AdaptiveTicketViewSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveTicketViewSummaryStore(): AdaptiveTicketViewSummaryStore {
  return new MemoryAdaptiveTicketViewSummaryStore(new Map<string, AdaptiveTicketViewSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveTicketViewSummaryStore implements AdaptiveTicketViewSummaryStore {
  inner: AdaptiveTicketViewSummaryStore;
  cache: cache.TtlCache<AdaptiveTicketViewSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveTicketViewSummaryStore,
    cacheValue: cache.TtlCache<AdaptiveTicketViewSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveTicketViewSummary | undefined {
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

  save(item: AdaptiveTicketViewSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveTicketViewSummary[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveTicketViewSummaryStore(inner: AdaptiveTicketViewSummaryStore, ttl: number, clockValue: clock.Clock): AdaptiveTicketViewSummaryStore {
  return new CachedAdaptiveTicketViewSummaryStore(
    inner,
    cache.newTtlCache<AdaptiveTicketViewSummary>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive ticket view summaries. Empty fields match all. */
export class AdaptiveTicketViewSummaryQuery {
  segment: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWindowDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveTicketViewSummary): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveTicketViewSummary[]): AdaptiveTicketViewSummary[] {
    const matched = collections.filter(items, (candidate: AdaptiveTicketViewSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveTicketViewSummaries(store: AdaptiveTicketViewSummaryStore, query: AdaptiveTicketViewSummaryQuery): AdaptiveTicketViewSummary[] {
  return query.apply(store.list());
}

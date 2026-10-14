import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingJourneySummary } from "./pending-journey-summary.js";

/** Keeps pending journey summaries by code. */
export interface PendingJourneySummaryStore {
  find(code: string): PendingJourneySummary | undefined;
  save(item: PendingJourneySummary): void;
  remove(code: string): boolean;
  list(): PendingJourneySummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingJourneySummaryStore implements PendingJourneySummaryStore {
  items: Map<string, PendingJourneySummary>;
  order: string[];

  constructor(items: Map<string, PendingJourneySummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingJourneySummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingJourneySummary): void {
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

  list(): PendingJourneySummary[] {
    const out: PendingJourneySummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingJourneySummaryStore(): PendingJourneySummaryStore {
  return new MemoryPendingJourneySummaryStore(new Map<string, PendingJourneySummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingJourneySummaryStore implements PendingJourneySummaryStore {
  inner: PendingJourneySummaryStore;
  cache: cache.TtlCache<PendingJourneySummary>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingJourneySummaryStore,
    cacheValue: cache.TtlCache<PendingJourneySummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingJourneySummary | undefined {
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

  save(item: PendingJourneySummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingJourneySummary[] {
    return this.inner.list();
  }
}

export function newCachedPendingJourneySummaryStore(inner: PendingJourneySummaryStore, ttl: number, clockValue: clock.Clock): PendingJourneySummaryStore {
  return new CachedPendingJourneySummaryStore(
    inner,
    cache.newTtlCache<PendingJourneySummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending journey summaries. Empty fields match all. */
export class PendingJourneySummaryQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingJourneySummary): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingJourneySummary[]): PendingJourneySummary[] {
    const matched = collections.filter(items, (candidate: PendingJourneySummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingJourneySummaries(store: PendingJourneySummaryStore, query: PendingJourneySummaryQuery): PendingJourneySummary[] {
  return query.apply(store.list());
}

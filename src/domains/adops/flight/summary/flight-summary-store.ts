import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightSummary } from "./flight-summary.js";

/** Keeps flight summaries by code. */
export interface FlightSummaryStore {
  find(code: string): FlightSummary | undefined;
  save(item: FlightSummary): void;
  remove(code: string): boolean;
  list(): FlightSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightSummaryStore implements FlightSummaryStore {
  items: Map<string, FlightSummary>;
  order: string[];

  constructor(items: Map<string, FlightSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightSummary): void {
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

  list(): FlightSummary[] {
    const out: FlightSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightSummaryStore(): FlightSummaryStore {
  return new MemoryFlightSummaryStore(new Map<string, FlightSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightSummaryStore implements FlightSummaryStore {
  inner: FlightSummaryStore;
  cache: cache.TtlCache<FlightSummary>;
  hits: number;
  misses: number;

  constructor(inner: FlightSummaryStore, cacheValue: cache.TtlCache<FlightSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightSummary | undefined {
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

  save(item: FlightSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightSummary[] {
    return this.inner.list();
  }
}

export function newCachedFlightSummaryStore(inner: FlightSummaryStore, ttl: number, clockValue: clock.Clock): FlightSummaryStore {
  return new CachedFlightSummaryStore(inner, cache.newTtlCache<FlightSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects flight summaries. Empty fields match all. */
export class FlightSummaryQuery {
  utmSource: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBudget: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightSummary): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightSummary[]): FlightSummary[] {
    const matched = collections.filter(items, (candidate: FlightSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightSummaries(store: FlightSummaryStore, query: FlightSummaryQuery): FlightSummary[] {
  return query.apply(store.list());
}

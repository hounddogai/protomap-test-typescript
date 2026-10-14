import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightScore } from "./flight-score.js";

/** Keeps flight scores by code. */
export interface FlightScoreStore {
  find(code: string): FlightScore | undefined;
  save(item: FlightScore): void;
  remove(code: string): boolean;
  list(): FlightScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightScoreStore implements FlightScoreStore {
  items: Map<string, FlightScore>;
  order: string[];

  constructor(items: Map<string, FlightScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightScore): void {
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

  list(): FlightScore[] {
    const out: FlightScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightScoreStore(): FlightScoreStore {
  return new MemoryFlightScoreStore(new Map<string, FlightScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightScoreStore implements FlightScoreStore {
  inner: FlightScoreStore;
  cache: cache.TtlCache<FlightScore>;
  hits: number;
  misses: number;

  constructor(inner: FlightScoreStore, cacheValue: cache.TtlCache<FlightScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightScore | undefined {
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

  save(item: FlightScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightScore[] {
    return this.inner.list();
  }
}

export function newCachedFlightScoreStore(inner: FlightScoreStore, ttl: number, clockValue: clock.Clock): FlightScoreStore {
  return new CachedFlightScoreStore(inner, cache.newTtlCache<FlightScore>(64, ttl, clockValue), 0, 0);
}

/** Selects flight scores. Empty fields match all. */
export class FlightScoreQuery {
  country: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minWindowDays: number, statuses: string[], limit: number) {
    this.country = country;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightScore): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightScore[]): FlightScore[] {
    const matched = collections.filter(items, (candidate: FlightScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightScores(store: FlightScoreStore, query: FlightScoreQuery): FlightScore[] {
  return query.apply(store.list());
}

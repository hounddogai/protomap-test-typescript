import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightBaseline } from "./flight-baseline.js";

/** Keeps flight baselines by code. */
export interface FlightBaselineStore {
  find(code: string): FlightBaseline | undefined;
  save(item: FlightBaseline): void;
  remove(code: string): boolean;
  list(): FlightBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightBaselineStore implements FlightBaselineStore {
  items: Map<string, FlightBaseline>;
  order: string[];

  constructor(items: Map<string, FlightBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightBaseline): void {
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

  list(): FlightBaseline[] {
    const out: FlightBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightBaselineStore(): FlightBaselineStore {
  return new MemoryFlightBaselineStore(new Map<string, FlightBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightBaselineStore implements FlightBaselineStore {
  inner: FlightBaselineStore;
  cache: cache.TtlCache<FlightBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: FlightBaselineStore,
    cacheValue: cache.TtlCache<FlightBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightBaseline | undefined {
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

  save(item: FlightBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightBaseline[] {
    return this.inner.list();
  }
}

export function newCachedFlightBaselineStore(inner: FlightBaselineStore, ttl: number, clockValue: clock.Clock): FlightBaselineStore {
  return new CachedFlightBaselineStore(inner, cache.newTtlCache<FlightBaseline>(64, ttl, clockValue), 0, 0);
}

/** Selects flight baselines. Empty fields match all. */
export class FlightBaselineQuery {
  name: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMargin: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightBaseline[]): FlightBaseline[] {
    const matched = collections.filter(items, (candidate: FlightBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightBaselines(store: FlightBaselineStore, query: FlightBaselineQuery): FlightBaseline[] {
  return query.apply(store.list());
}

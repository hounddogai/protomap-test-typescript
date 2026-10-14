import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FlightGroup } from "./flight-group.js";

/** Keeps flight groups by code. */
export interface FlightGroupStore {
  find(code: string): FlightGroup | undefined;
  save(item: FlightGroup): void;
  remove(code: string): boolean;
  list(): FlightGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFlightGroupStore implements FlightGroupStore {
  items: Map<string, FlightGroup>;
  order: string[];

  constructor(items: Map<string, FlightGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FlightGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FlightGroup): void {
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

  list(): FlightGroup[] {
    const out: FlightGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFlightGroupStore(): FlightGroupStore {
  return new MemoryFlightGroupStore(new Map<string, FlightGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFlightGroupStore implements FlightGroupStore {
  inner: FlightGroupStore;
  cache: cache.TtlCache<FlightGroup>;
  hits: number;
  misses: number;

  constructor(inner: FlightGroupStore, cacheValue: cache.TtlCache<FlightGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FlightGroup | undefined {
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

  save(item: FlightGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FlightGroup[] {
    return this.inner.list();
  }
}

export function newCachedFlightGroupStore(inner: FlightGroupStore, ttl: number, clockValue: clock.Clock): FlightGroupStore {
  return new CachedFlightGroupStore(inner, cache.newTtlCache<FlightGroup>(128, ttl, clockValue), 0, 0);
}

/** Selects flight groups. Empty fields match all. */
export class FlightGroupQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FlightGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FlightGroup[]): FlightGroup[] {
    const matched = collections.filter(items, (candidate: FlightGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFlightGroups(store: FlightGroupStore, query: FlightGroupQuery): FlightGroup[] {
  return query.apply(store.list());
}
